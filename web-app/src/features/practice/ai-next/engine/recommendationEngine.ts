import type {
  BoardState,
  CardRoleProfile,
  KeyCard,
  RecommendationResult,
  ScoredAction,
} from "../domain/types";
import { buildBoardUrgencyProfile } from "./boardUrgency";
import { buildActionCandidatesFromProfiles, inferDynamicRoles } from "./candidateGenerator";
import { buildCoachNarrative } from "../explain/coachExplainer";
import { inferOpponentArchetype, inferOpponentThreat } from "../inference/opponentInference";
import { analyzeDeckContext } from "../inference/deckContextAnalyzer";
import { predictBoardState } from "./boardPredictor";
import { evaluateOpeningHand } from "../inference/openingHandEvaluator";
import { generateMacroStrategy } from "../inference/prizePlanGenerator";
import { evaluateDeckCompressionValue } from "../utils/probabilityUtils";
import type { BoardDiff, ArchetypeStrategy, ActionCandidate, OpeningEvaluation, OpponentThreat, MacroStrategy } from "../domain/types";

type HandCardLike = { instanceId?: string; name: string };

function calculateBoardDiff(board: BoardState, strategy: ArchetypeStrategy): BoardDiff {
  const missingBench = Math.max(0, strategy.idealBoard.minBenchItems - board.bench.length);
  const activeHasEnergy = (board.active?.energies ?? 0) > 0;
  const missingEnergy = strategy.idealBoard.requireEnergyOnActive && !activeHasEnergy ? 1 : 0;
  
  const hasEvolutionOnBoard = [...board.bench, ...(board.active ? [board.active] : [])].some(p => p.hp && p.hp > 150); // Simple heuristic for Stage 1/2
  const missingEvolution = strategy.idealBoard.requireEvolutionReady && !hasEvolutionOnBoard;

  return {
    missingBench,
    missingEnergy,
    missingEvolution,
    isIdeal: missingBench === 0 && missingEnergy === 0 && !missingEvolution
  };
}

type StrategyWeights = {
  setup: number;
  draw: number;
  gust: number;
  tempo: number;
  recovery: number;
  damage: number;
};

function resolveStrategy(archetype?: string, phase?: string): StrategyWeights {
  if (archetype === "charizard_ex") {
    return phase === "opening"
      ? { setup: 1.4, draw: 1.2, gust: 0.8, tempo: 1.0, recovery: 0.8, damage: 0.9 }
      : { setup: 1.0, draw: 1.0, gust: 1.2, tempo: 1.1, recovery: 0.9, damage: 1.2 };
  }

  if (archetype === "dragapult_ex") {
    return { setup: 1.0, draw: 1.0, gust: 1.15, tempo: 1.2, recovery: 0.9, damage: 1.1 };
  }

  if (archetype === "gardevoir_ex") {
    return { setup: 1.25, draw: 1.15, gust: 0.95, tempo: 1.0, recovery: 1.2, damage: 1.0 };
  }

  return { setup: 1.0, draw: 1.0, gust: 1.0, tempo: 1.0, recovery: 1.0, damage: 1.0 };
}

function scoreAction(
  action: ReturnType<typeof buildActionCandidatesFromProfiles>[number],
  board: BoardState,
  profiles: CardRoleProfile[],
  urgency: ReturnType<typeof buildBoardUrgencyProfile>,
  openingEvaluation?: OpeningEvaluation,
  archetype?: string,
  opponentArchetype?: string,
  opponentThreat?: OpponentThreat,
  macroStrategy?: MacroStrategy
): ScoredAction {
  const strategy = resolveStrategy(archetype, urgency.phase);
  const profile = profiles.find((p) => p.cardName === action.cardName);
  const dynamicRoles = inferDynamicRoles(action, board, urgency);

  let score = 0;
  score += action.estimatedSetupGain * 12 * strategy.setup * (1 + urgency.needSetupNow / 100);
  score += action.estimatedStabilityGain * 10 * strategy.draw * (1 + urgency.needDrawNow / 100);
  score += action.estimatedPrizeSwing * 14 * strategy.gust * (1 + urgency.canPushPrizeNow / 100);

  // 2手先（Lookahead）の価値を加算
  let bestNextVal = 0;
  const nextBoard = predictBoardState(board, action);
  const nextUrgency = buildBoardUrgencyProfile(nextBoard, { handCards: nextBoard.hand.map(n => ({ name: n })), profiles });
  const nextCandidates = buildActionCandidatesFromProfiles(nextBoard, nextBoard.hand.map(n => ({ name: n })), profiles, nextUrgency);
  if (nextCandidates.length > 0) {
    bestNextVal = Math.max(...nextCandidates.map(c => c.estimatedPrizeSwing * 10 + c.estimatedSetupGain * 8 + c.estimatedStabilityGain * 6));
    score += bestNextVal * 0.35; // 35% を今の価値に「予約」として上乗せ
  }

  if (action.tags.includes("tempo")) score += 8 * strategy.tempo * (1 + urgency.tempoCatchupValue / 100);
  if (action.tags.includes("recover")) score += 10 * strategy.recovery * (1 + urgency.needRecoveryNow / 100);
  if (action.tags.includes("damage")) score += 10 * strategy.damage * (1 + urgency.canPushPrizeNow / 100);

  if (dynamicRoles.includes("system_snipe")) score += 22;
  if (dynamicRoles.includes("stall_trap")) score += 16;
  if (dynamicRoles.includes("finisher_gust")) score += urgency.phase === "endgame" ? 24 : 10;
  if (dynamicRoles.includes("bench_fill_now")) score += 15;
  if (dynamicRoles.includes("desperate_draw")) score += 14;
  if (dynamicRoles.includes("recover_board")) score += 12;

  if (openingEvaluation) {
    const openingIsStable = openingEvaluation.stability === "stable" || openingEvaluation.stability === "average";
    if (openingIsStable && action.tags.includes("draw")) score -= 14;
    if (openingIsStable && action.tags.includes("bench_setup")) score += 10;
    if (openingIsStable && action.tags.includes("search")) score += 8;
  }

  if (profile?.staticRoles.includes("topdeck_tutor" as never) && urgency.phase === "endgame") score += 12;
  if (profile?.staticRoles.includes("resource_recovery" as never) && board.discard.length >= 8) score += 10;
  if (profile?.staticRoles.includes("pivot" as never) && urgency.needSwitchNow >= 50) score += 8;

  // 大局観（マクロ戦略）に基づくボーナス
  if (macroStrategy) {
    if (macroStrategy.activePlan === 'control_lo' && dynamicRoles.includes("stall_trap")) {
      score += 50; // コントロール方針の場合のバインドの価値を跳ね上げる
    }
    if (macroStrategy.activePlan === 'survival_stall' && action.tags.includes("recover")) {
      score += 30; // ターン稼ぎが必要な時の回復の価値を高く
    }
    // 相手のペースが早く防衛ルートが選ばれた時は妨害の価値をさらに上げる
    if (macroStrategy.activePlan === '1-2-2-1_route' && opponentThreat && action.tags.includes("disrupt")) {
      score += 20; 
    }
  }

  // 確率論とリソース管理（山札圧縮など）
  // 例：山を掘り進めるドローサポートがある手札で、先にサーチ札（不要札を抜く）を使う順番のスコアを上げる
  const hasDrawSupportInHand = board.hand.some(h => profiles.find(p => p.cardName === h)?.staticRoles.includes("draw" as never));
  if (hasDrawSupportInHand && action.tags.some(t => t.includes("search") || t.includes("deck_fixing"))) {
    // 例：博士の研究を打つ前に山を1枚圧縮すると、キーカード（残り2枚と仮定）を7枚ドローで引く確率がどれくらい上がるか
    const compressionVal = evaluateDeckCompressionValue(board.deckRemaining, 2, 1, 7);
    if (compressionVal > 0) {
      score += Math.min(20, compressionVal * 150); // 確率上昇分スコア化
    }
  }

  // リソース枯渇リスクのペナルティ
  // 例：山札が極端に少ない時にドローしすぎるのはLOリスク
  if (board.deckRemaining <= 3 && action.tags.includes("draw")) {
    score -= 40; 
  }

  // 対面（Matchup）に応じたスコア補正
  if (opponentArchetype === "Lugia VSTAR" && dynamicRoles.includes("system_snipe")) {
    score += 10; // アーケオス等を狙う価値を高める
  }
  if (opponentThreat && action.tags.includes("disrupt")) {
    score += opponentThreat.disruptValue; // 手札干渉のケア価値
  }

  const reasons: string[] = [];
  if (action.estimatedSetupGain > 0) reasons.push("盤面形成に寄与する。");
  if (action.estimatedStabilityGain > 0) reasons.push("次ターンの再現性を上げる。");
  if (action.estimatedPrizeSwing > 0) reasons.push("サイドレースを前に進める。");
  if (bestNextVal > 30) reasons.push("次の強力な一手につながるコンボの起点。");
  if (dynamicRoles.includes("system_snipe")) reasons.push("相手システムを倒してテンポを奪える。");
  if (dynamicRoles.includes("stall_trap")) reasons.push("高にげエネを縛って育成ターンを稼げる。");
  if (dynamicRoles.includes("bench_fill_now")) reasons.push("今ターンの展開不足を直接補える。");
  if (dynamicRoles.includes("desperate_draw")) reasons.push("事故手札からの復帰ラインとして有効。");
  if (opponentThreat && action.tags.includes("disrupt")) {
    if (opponentThreat.lethalThreat) {
      reasons.push(`相手の次ターン最大打点（${opponentThreat.expectedMaxDamage}）による負けを防ぐため、手札干渉の価値が高い。`);
    } else {
      reasons.push(`相手の要求札（約${opponentThreat.requiredCards}枚）を揃えさせないための妨害。`);
    }
  }
  if (macroStrategy?.activePlan === 'control_lo' && dynamicRoles.includes("stall_trap")) {
    reasons.push("LO（山札切れ）を狙う大局観にマッチした壁役配置。");
  }
  if (hasDrawSupportInHand && action.tags.some(t => t.includes("search") || t.includes("deck_fixing"))) {
    reasons.push("ドローサポートを打つ前に不要なカードを抜き、山札を圧縮（確率最大化）するプレイング。");
  }
  if (board.deckRemaining <= 3 && action.tags.includes("draw")) {
    reasons.push("LO（山札切れ）リスクがあるため、ドローに対するペナルティ。");
  }

  return {
    ...action,
    score,
    priority: score >= 85 ? "high" : score >= 55 ? "medium" : "low",
    reasons,
    dynamicRoles,
  };
}

function buildKeyCards(profiles: CardRoleProfile[], handCards: HandCardLike[], board: BoardState): KeyCard[] {
  const names = new Set(handCards.map((c) => c.name));
  return profiles
    .filter((p) => names.has(p.cardName))
    .map((p) => {
      let score = p.staticRoles.length * 7 + (p.primitives?.length ?? 0) * 2;
      if (p.staticRoles.includes("gust" as never)) score += 12;
      if (p.staticRoles.includes("bench_setup" as never) && board.bench.length <= 2) score += 10;
      if (p.staticRoles.includes("draw" as never) && board.hand.length <= 4) score += 10;
      return {
        cardName: p.cardName,
        score,
        reason: p.reasons?.[0] ?? "このターンの有力ラインに関係している。",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function boardSummary(board: BoardState): string {
  if (board.turn === 0 || (board.turn === 1 && !board.active)) {
    return `対戦準備中 / 手札${board.hand.length}枚`;
  }
  return `ターン${board.turn} / 手札${board.hand.length}枚 / ベンチ${board.bench.length}体 / 相手ベンチ${board.opponentBench.length}体`;
}

export function buildRecommendationFromRoleComplete(params: {
  board: BoardState;
  handCards: HandCardLike[];
  profiles: CardRoleProfile[];
  archetype?: string;
}): RecommendationResult {
  const { board, handCards, profiles, archetype } = params;
  const urgency = buildBoardUrgencyProfile(board, { handCards, profiles });
  const opponentArchetype = inferOpponentArchetype(board);
  const opponentThreat = inferOpponentThreat(board, opponentArchetype);
  const macroStrategy = generateMacroStrategy(board, archetype || "generic");
  const strategy = analyzeDeckContext({ name: archetype || "generic", archetype: archetype || "generic", cards: [] });
  const boardDiff = calculateBoardDiff(board, strategy);
  const openingEvaluation = board.turn <= 1 ? evaluateOpeningHand(board, profiles) : undefined;
  
  const candidates = buildActionCandidatesFromProfiles(board, handCards, profiles, urgency);
  const scored = candidates
    .map((c) => scoreAction(c, board, profiles, urgency, openingEvaluation, archetype, opponentArchetype, opponentThreat, macroStrategy))
    .sort((a, b) => b.score - a.score);

  const uniqueScored: ScoredAction[] = [];
  const seenActionCards = new Set<string>();
  for (const action of scored) {
    if (!seenActionCards.has(action.cardName)) {
      seenActionCards.add(action.cardName);
      uniqueScored.push(action);
    }
  }

  const bestAction = uniqueScored[0] ?? null;
  const alternatives = uniqueScored.slice(1, 6);
  
  // アクション候補(有力ライン)として既に提案されたカード名を集める
  const suggestedNames = new Set([
      ...uniqueScored.slice(0, 6).map(a => a.cardName)
  ].filter(Boolean));

  // キーカードから重複するカードを除き、純粋に「手札等の重要なカード」としてピックアップする
  const rawKeyCards = buildKeyCards(profiles, handCards, board);
  
  const uniqueKeyCards: KeyCard[] = [];
  const seenKeyCards = new Set<string>(suggestedNames);
  for (const kc of rawKeyCards) {
    if (!seenKeyCards.has(kc.cardName)) {
      seenKeyCards.add(kc.cardName);
      uniqueKeyCards.push(kc);
    }
  }
  
  const keyCards = uniqueKeyCards.slice(0, 5);

  let analysis = buildCoachNarrative(
    board, 
    urgency, 
    bestAction, 
    alternatives, 
    openingEvaluation ? { 
      handGrade: openingEvaluation.stability === 'stable' ? 'A' : openingEvaluation.stability === 'average' ? 'B' : 'D', 
      openingSummary: openingEvaluation.reason 
    } : undefined
  );

  // 対戦準備中（turn === 0 または turn === 1かつアクティブ不在）の場合の専用ガイダンス
  if (board.turn === 0 || (board.turn === 1 && !board.active)) {
    analysis = `【対戦準備中】\n1ターン目の目標は、メインアタッカーやシステム基盤となる「たねポケモン」を場に複数展開することです。\n現在の初期手札から、どのように盤面を構築する（または山札を引く・サーチする）のが最も安定するかを最優先に考えましょう。不要なカードは極力プレイせず、次ターンの手札干渉や展開に備えるのが基本です。`;
  }


  return {
    bestAction,
    alternatives,
    keyCards,
    analysis,
    boardStateSummary: boardSummary(board),
    boardDiff,
    openingEvaluation,
    opponentThreat,
    macroStrategy,
    timestamp: new Date().toISOString(),
    version: "role-complete-recommendation.v3",
  };
}

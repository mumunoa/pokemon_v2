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
import { inferOpponentArchetype } from "../inference/opponentInference";
import { analyzeDeckContext } from "../inference/deckContextAnalyzer";
import { predictBoardState } from "./boardPredictor";
import { evaluateOpeningHand } from "../inference/openingHandEvaluator";
import type { BoardDiff, ArchetypeStrategy, ActionCandidate, OpeningEvaluation } from "../domain/types";

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
  archetype?: string,
  opponentArchetype?: string,
): ScoredAction {
  const urgency = buildBoardUrgencyProfile(board);
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
  const nextUrgency = buildBoardUrgencyProfile(nextBoard);
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

  if (profile?.staticRoles.includes("topdeck_tutor" as never) && urgency.phase === "endgame") score += 12;
  if (profile?.staticRoles.includes("resource_recovery" as never) && board.discard.length >= 8) score += 10;
  if (profile?.staticRoles.includes("pivot" as never) && urgency.needSwitchNow >= 50) score += 8;

  // 対面（Matchup）に応じたスコア補正
  if (opponentArchetype === "Lugia VSTAR" && dynamicRoles.includes("system_snipe")) {
    score += 10; // アーケオス等を狙う価値を高める
  }
  if (opponentArchetype === "Charizard ex" && action.tags.includes("disrupt")) {
    score += 8; // 手札干渉等の価値を上げる
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
  return `ターン${board.turn} / 手札${board.hand.length}枚 / ベンチ${board.bench.length}体 / 相手ベンチ${board.opponentBench.length}体`;
}

export function buildRecommendationFromRoleComplete(params: {
  board: BoardState;
  handCards: HandCardLike[];
  profiles: CardRoleProfile[];
  archetype?: string;
}): RecommendationResult {
  const { board, handCards, profiles, archetype } = params;
  const urgency = buildBoardUrgencyProfile(board);
  const opponentArchetype = inferOpponentArchetype(board);
  const strategy = analyzeDeckContext({ name: archetype || "generic", archetype: archetype || "generic", cards: [] });
  const boardDiff = calculateBoardDiff(board, strategy);
  const openingEvaluation = board.turn <= 1 ? evaluateOpeningHand(board, profiles) : undefined;
  
  const candidates = buildActionCandidatesFromProfiles(board, handCards, profiles, urgency);
  const scored = candidates
    .map((c) => scoreAction(c, board, profiles, archetype, opponentArchetype))
    .sort((a, b) => b.score - a.score);

  const bestAction = scored[0] ?? null;
  const alternatives = scored.slice(1, 6);
  const keyCards = buildKeyCards(profiles, handCards, board);
  const analysis = buildCoachNarrative(board, urgency, bestAction, alternatives);

  return {
    bestAction,
    alternatives,
    keyCards,
    analysis,
    boardStateSummary: boardSummary(board),
    boardDiff,
    openingEvaluation,
    timestamp: new Date().toISOString(),
    version: "role-complete-recommendation.v3",
  };
}

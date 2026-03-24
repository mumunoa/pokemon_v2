import type { CardRoleProfile, DynamicRole } from "../domain/types";
import type {
  CoachGameState,
  LegalAction,
  ProfessionalCoachResult,
  ProfessionalLine,
} from "./types";
import { extractBoardFeatures } from "./featureExtractor";
import { generateLegalActions } from "./legalAction";
import { applyStateTransition } from "./stateTransition";
import { evaluateNextState } from "./nextStateEvaluation";
import { simulateOpeningMetrics } from "./openingSimulation";
import { buildEffectSpecForCard } from "../effects/effectSpecCatalog";
import type { EffectContext } from "../effects/effectSpecTypes";

function inferArchetype(state: CoachGameState, profiles: CardRoleProfile[]): string {
  const names = new Set(Object.values(state.cards ?? {}).map((card: any) => card?.name).filter(Boolean));
  if (names.has("リザードンex")) return "charizard_ex";
  if (names.has("ドラパルトex")) return "dragapult_ex";
  if (names.has("サーナイトex")) return "gardevoir_ex";
  if ([...names].some((name) => String(name).includes("ロケット団"))) return "rocket_control";

  const setupCheat = profiles.filter((p) => p.staticRoles.includes("setup_cheat")).length;
  const spread = profiles.filter((p) => p.staticRoles.includes("spread")).length;
  if (setupCheat >= 3) return "stage2_midrange";
  if (spread >= 3) return "spread_control";

  return state.selectedArchetype ?? "generic";
}

function replyPenalty(action: LegalAction): number {
  switch (action.kind) {
    case "play_supporter":
      return action.category === "gust" ? 16 : action.category === "draw" ? 10 : 8;
    case "play_item":
      return action.category === "search_basic" ? 8 : 10;
    case "retreat":
      return 12;
    case "attack":
      return 6;
    default:
      return 9;
  }
}

function inferDynamicRoles(action: LegalAction, primitiveBonus: number): DynamicRole[] {
  const roles: DynamicRole[] = [];
  if (action.kind === "play_supporter" && action.category === "gust") roles.push("finisher_gust");
  if (action.kind === "play_supporter" && action.category === "draw") roles.push("desperate_draw");
  if (action.kind === "play_item" && action.category === "search_basic") roles.push("bench_fill_now", "setup_priority");
  if (action.kind === "retreat") roles.push("retreat_pivot");
  if (action.kind === "play_item" && action.category === "recovery") roles.push("recover_board");
  if (action.kind === "attack") roles.push("swing_turn");
  if (primitiveBonus >= 18) roles.push("force_response");
  return Array.from(new Set(roles));
}

function keyCards(handProfiles: CardRoleProfile[]) {
  return handProfiles
    .map((p) => {
      let score = p.staticRoles.length * 7 + (p.primitives?.length ?? 0) * 2;
      if (p.staticRoles.includes("gust")) score += 12;
      if (p.staticRoles.includes("draw") || p.staticRoles.includes("hand_refresh")) score += 10;
      if (p.staticRoles.includes("basic_search") || p.staticRoles.includes("bench_setup")) score += 11;
      return {
        cardName: p.cardName,
        score,
        reason: p.reasons?.[0] ?? "このターンの勝ち筋に関与する札です。",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function thoughts(params: {
  phase: "opening" | "midgame" | "endgame";
  ownPrizesRemaining: number;
  oppPrizesRemaining: number;
  bestLineText: string;
}) {
  return [
    `【思考1: 勝利条件の確認】${params.phase.toUpperCase()}です。サイド ${params.ownPrizesRemaining}-${params.oppPrizesRemaining} の取り切りルートを優先します。`,
    "【思考2: 盤面の守備力チェック】相手の次ターン最大打点と、こちらの2 prize の露出を確認します。",
    "【思考3: リソース管理】終盤のボス・ナンジャモ・回収札まで見て、今使う札と残す札を分けます。",
    `【思考4: 最短勝ち筋】現時点では「${params.bestLineText}」がもっとも勝ち筋に直結します。`,
  ];
}

function actionLineText(action: LegalAction): string {
  switch (action.kind) {
    case "play_supporter":
      if (action.category === "gust") return `${action.cardName} で ${action.targetName ?? "相手"} を呼び出して盤面を崩す`;
      if (action.category === "draw") return `${action.cardName} で手札を更新して必要札へ寄せる`;
      if (action.category === "disrupt") return `${action.cardName} で相手要求値を上げる`;
      if (action.category === "recovery") return `${action.cardName} で盤面を立て直す`;
      return `${action.cardName} を使って盤面を進める`;
    case "play_item":
      if (action.category === "search_basic") return `${action.cardName} でたねポケモンへ触って展開する`;
      if (action.category === "search_any") return `${action.cardName} で必要ポケモンへ到達する`;
      if (action.category === "switch") return `${action.cardName} でアクティブを入れ替える`;
      if (action.category === "recovery") return `${action.cardName} で落ちた札を回収する`;
      return `${action.cardName} で盤面を前進させる`;
    case "play_stadium":
      return `${action.cardName} で局面条件を変える`;
    case "play_tool":
      return `${action.cardName} を ${action.targetName} に付ける`;
    case "use_ability":
      return `${action.sourceName} の特性を使う`;
    case "attach_energy":
      return `${action.targetName} にエネルギーを貼る`;
    case "retreat":
      return `${action.toName} に引いてテンポを維持する`;
    case "attack":
      return `${action.attackName} で攻撃する`;
  }
}


export function buildProfessionalCoachResult(params: {
  state: CoachGameState;
  profiles: CardRoleProfile[];
  deckForOpeningSimulation?: Array<{ id?: string; cardId?: string; name: string; type?: string; kinds?: string }>;
}): ProfessionalCoachResult {
  const archetype = inferArchetype(params.state, params.profiles);
  const handNames = new Set(params.state.players.player1.hand.map((c) => c.name));
  const handProfiles = params.profiles.filter((p) => handNames.has(p.cardName));
  const features = extractBoardFeatures(params.state, handProfiles);
  const actions = generateLegalActions(params.state, params.profiles);

  // Effect Context の作成
  const ctx: EffectContext = {
    phase: features.phase,
    setupNeed: features.setupNeed,
    drawNeed: features.drawNeed,
    gustNeed: features.gustNeed,
    safetyNeed: features.safetyNeed,
    handSize: params.state.players.player1.hand.length,
    ownBenchCount: features.ownBenchCount,
    oppBenchCount: features.oppBenchCount,
    supporterUsed: params.state.players.player1.supporterUsed,
    energyAttachedThisTurn: params.state.players.player1.energyAttachedThisTurn,
    hasFreeBenchSlot: features.ownBenchCount < 5,
    opponentHasSystem: features.oppSystemCount > 0,
    opponentHasHeavyRetreat: features.oppHeavyRetreatCount > 0,
  };

  const lines: ProfessionalLine[] = actions.map((action) => {
    const cardName = "cardName" in action ? action.cardName : "sourceName" in action ? action.sourceName : "";
    const profile = params.profiles.find((p) => p.cardName === cardName);
    const spec = buildEffectSpecForCard(cardName, profile);
    
    const transition = applyStateTransition(params.state, action, params.profiles);
    const nextEval = evaluateNextState(transition.nextState, handProfiles, archetype);
    
    // 個別実装（Spec）によるボーナス適用
    let priorityBonus = 0;
    let specReasons: string[] = [];
    
    if (spec && (!spec.canPlay || spec.canPlay(ctx))) {
      priorityBonus = spec.priorityBase - 40; // 基礎値40からの差分をボーナスとする
      specReasons = spec.explainWhyNow?.(ctx) ?? [];
    }
    
    const lineScore = nextEval.total * 0.72 + (nextEval.total - replyPenalty(action)) * 0.28 + priorityBonus;
    const dynamicRoles = inferDynamicRoles(action, priorityBonus);
    
    return {
      action,
      transition,
      nextEval,
      replyPenalty: replyPenalty(action),
      lineScore,
      dynamicRoles,
      primitiveReasons: specReasons.length > 0 ? specReasons : (profile?.reasons?.slice(0, 2) ?? []),
    };
  }).sort((a, b) => b.lineScore - a.lineScore);

  const mappedLines: any[] = lines.map((line) => {
    const total = Number.isFinite(line.nextEval.total) ? line.nextEval.total : 0;
    const penalty = Number.isFinite(line.replyPenalty) ? line.replyPenalty : 0;
    const score = Number.isFinite(line.lineScore) ? line.lineScore : total;

    return {
      ...line,
      id: line.action.kind + "_" + (line.action.kind === "attack" ? line.action.attackName : "cardId" in line.action ? line.action.cardId : "sourceId" in line.action ? line.action.sourceId : ""),
      cardName: "cardName" in line.action ? line.action.cardName : "sourceName" in line.action ? line.action.sourceName : "ポケモンの入れ替え",
      line: actionLineText(line.action),
      score,
      priority: score > 80 ? 'high' : score > 40 ? 'medium' : 'low',
      reasons: line.primitiveReasons.length > 0 ? line.primitiveReasons : line.nextEval.reasons,
      dynamicRoles: line.dynamicRoles,
    };
  });

  const bestAction = mappedLines[0] ?? null;
  const openingMetrics =
    params.deckForOpeningSimulation && params.deckForOpeningSimulation.length > 0
      ? simulateOpeningMetrics({
          deck: params.deckForOpeningSimulation,
          profileMap: new Map(params.profiles.map((p) => [p.cardId || p.cardName, p])),
          archetype,
          iterations: 1000,
        })
      : undefined;

  return {
    phase: features.phase,
    archetype,
    boardStateSummary: `phase=${features.phase} / archetype=${archetype} / setupNeed=${features.setupNeed} / drawNeed=${features.drawNeed}`,
    thoughts: thoughts({
      phase: features.phase,
      ownPrizesRemaining: features.ownPrizesRemaining,
      oppPrizesRemaining: features.oppPrizesRemaining,
      bestLineText: bestAction ? bestAction.line : "有力手なし",
    }),
    bestAction,
    alternatives: mappedLines.slice(1, 6),
    keyCards: keyCards(handProfiles),
    openingMetrics,
    handProfiles,
    analysis: `現在の局面は${features.phase}です。${bestAction ? bestAction.line : '有力な候補が見つかりませんでした'}。`,
    timestamp: new Date().toISOString(),
    version: "2.2.0",
    opponentThreat: {
      expectedMaxDamage: features.tempoNeed > 50 ? 120 : 30, 
      requiredCards: Math.floor(features.drawNeed / 20) + 1,
      lethalThreat: features.safetyNeed > 60,
      disruptValue: features.gustNeed > 50 ? 20 : 5
    },
    macroStrategy: {
      activePlan: archetype.includes("control") ? "control_lo" : "2-2-2_route",
      estimatedTurnsToWin: Math.min(6, features.ownPrizesRemaining),
      opponentEstimatedTurnsToWin: Math.min(6, features.oppPrizesRemaining),
      description: `【${archetype.toUpperCase()}戦略】サイド残り ${features.ownPrizesRemaining}-${features.oppPrizesRemaining} です。現在のリソース（手札 ${params.state.players.player1.hand.length}枚）を考慮し、${features.phase === "opening" ? "盤面展開" : "サイド取得"}を優先してください。`
    }
  } as any;
}

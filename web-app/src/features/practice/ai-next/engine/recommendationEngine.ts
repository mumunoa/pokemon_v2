import type {
  ActionCandidate,
  BoardState,
  CardRoleProfile,
  KeyCard,
  RecommendationResult,
  ScoredAction,
} from "../domain/types";
import { buildBoardUrgencyProfile } from "./boardUrgency";
import { buildActionCandidatesFromProfiles, inferDynamicRolesForCandidate } from "./candidateGenerator";

type CardInstanceLike = {
  instanceId?: string;
  name: string;
  type?: string;
};

type ArchetypeStrategy = {
  archetype: string;
  prizeWeight: number;
  setupWeight: number;
  stabilityWeight: number;
  disruptionWeight: number;
  recoveryWeight: number;
};

function getArchetypeStrategy(archetype?: string): ArchetypeStrategy {
  switch (archetype) {
    case "charizard_ex":
    case "gardevoir_ex":
      return { archetype: archetype ?? "generic", prizeWeight: 1.0, setupWeight: 1.35, stabilityWeight: 1.1, disruptionWeight: 0.85, recoveryWeight: 1.0 };
    case "dragapult_ex":
      return { archetype: archetype ?? "generic", prizeWeight: 1.15, setupWeight: 1.0, stabilityWeight: 1.0, disruptionWeight: 1.2, recoveryWeight: 0.95 };
    default:
      return { archetype: archetype ?? "generic", prizeWeight: 1.0, setupWeight: 1.0, stabilityWeight: 1.0, disruptionWeight: 1.0, recoveryWeight: 1.0 };
  }
}

function priorityBand(score: number): "high" | "medium" | "low" {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function scoreAction(
  action: ActionCandidate,
  board: BoardState,
  archetype: string | undefined,
): ScoredAction {
  const urgency = buildBoardUrgencyProfile(board);
  const strategy = getArchetypeStrategy(archetype);
  const dynamicRoles = inferDynamicRolesForCandidate(action, board);

  const disruptionGain = action.tags.includes("stall") || action.tags.includes("force_response") ? 2 : 0;
  const recoveryGain = action.tags.includes("recover") ? 2 : 0;
  const tempoGain = action.tags.includes("switch") || action.tags.includes("gust") ? 2 : 1;
  const futureLineGain = action.tags.includes("future_line") ? 2 : 0;
  const riskPenalty = action.tags.includes("draw") && board.hand.length <= 1 ? 1 : 0;
  const resourceCostPenalty = action.cardName === "ハイパーボール" ? 1 : 0;

  const score =
    strategy.prizeWeight * action.estimatedPrizeSwing * (1 + urgency.canPushPrizeNow / 100) * 12 +
    strategy.setupWeight * action.estimatedSetupGain * (1 + urgency.needSetupNow / 100) * 10 +
    strategy.stabilityWeight * action.estimatedStabilityGain * (1 + urgency.needDrawNow / 100) * 8 +
    strategy.disruptionWeight * disruptionGain * (1 + urgency.needStallNow / 100) * 8 +
    strategy.recoveryWeight * recoveryGain * (1 + urgency.needRecoveryNow / 100) * 7 +
    tempoGain * 4 +
    futureLineGain * 6 -
    riskPenalty * 4 -
    resourceCostPenalty * 2;

  const reasons: string[] = [];
  if (action.estimatedPrizeSwing > 0) reasons.push("サイド進行へ寄与する。");
  if (action.estimatedSetupGain > 0) reasons.push("盤面形成を前進させる。");
  if (action.estimatedStabilityGain > 0) reasons.push("必要札への到達率を高める。");
  if (dynamicRoles.includes("system_snipe")) reasons.push("相手のシステムポケモンを狙える。");
  if (dynamicRoles.includes("stall_trap")) reasons.push("高にげエネを縛ってターンを稼げる。");
  if (dynamicRoles.includes("bench_fill_now")) reasons.push("今ターンのベンチ不足を埋められる。");
  if (dynamicRoles.includes("desperate_draw")) reasons.push("事故気味の手札からの復帰に向いている。");

  return {
    ...action,
    score,
    priority: priorityBand(score),
    reasons,
    dynamicRoles,
  };
}

function buildKeyCards(profiles: CardRoleProfile[], handCards: CardInstanceLike[]): KeyCard[] {
  const handNames = new Set(handCards.map((card) => card.name));
  return profiles
    .filter((profile) => handNames.has(profile.cardName))
    .map((profile) => ({
      cardName: profile.cardName,
      score:
        profile.staticRoles.length * 8 +
        (profile.staticRoles.includes("gust" as never) ? 10 : 0) +
        (profile.staticRoles.includes("bench_setup" as never) ? 8 : 0) +
        (profile.staticRoles.includes("draw" as never) ? 7 : 0),
      reason: profile.reasons?.[0] ?? "今ターンの行動候補と強く結びついている。",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function buildAnalysis(bestAction: ScoredAction | null, urgencySummary: string): string {
  if (!bestAction) {
    return `有力な行動が不足しています。${urgencySummary}`;
  }

  return [
    `おすすめの一手は「${bestAction.line}」です。`,
    urgencySummary,
    ...bestAction.reasons,
  ].join(" ");
}

function buildBoardStateSummary(board: BoardState): string {
  const activeName = board.active?.name ?? "なし";
  return `ターン${board.turn} / 手札${board.hand.length}枚 / ベンチ${board.bench.length}体 / アクティブ: ${activeName}`;
}

function buildUrgencySummary(board: BoardState): string {
  const urgency = buildBoardUrgencyProfile(board);
  const items: string[] = [];

  if (urgency.needSetupNow >= 60) items.push("盤面形成が最優先");
  if (urgency.needDrawNow >= 60) items.push("手札補充が急務");
  if (urgency.needGustNow >= 60) items.push("呼び出しで盤面を動かす価値が高い");
  if (urgency.needStallNow >= 60) items.push("テンポ阻害で1ターン稼ぐ価値が高い");
  if (urgency.needRecoveryNow >= 60) items.push("盤面復旧の価値が高い");

  return items.length > 0 ? `現局面では ${items.join(" / ")}。` : "現局面は安定行動優先。";
}

export function buildRecommendationEngine(params: {
  board: BoardState;
  handCards: CardInstanceLike[];
  profiles: CardRoleProfile[];
  archetype?: string;
}): RecommendationResult {
  const { board, handCards, profiles, archetype } = params;

  const generated = buildActionCandidatesFromProfiles(
    board,
    handCards,
    profiles,
    buildBoardUrgencyProfile(board),
    { archetype },
  );

  const scored = generated
    .map((action) => scoreAction(action, board, archetype))
    .sort((a, b) => b.score - a.score);

  const bestAction = scored[0] ?? null;
  const keyCards = buildKeyCards(profiles, handCards);
  const boardStateSummary = buildBoardStateSummary(board);
  const analysis = buildAnalysis(bestAction, buildUrgencySummary(board));

  return {
    bestAction,
    alternatives: scored.slice(1, 5),
    keyCards,
    analysis,
    boardStateSummary,
    timestamp: new Date().toISOString(),
    version: "coach-engine.v3",
  };
}

/**
 * Backward compatibility wrapper.
 */
export function buildRecommendation(params: {
  cardsMaster: any[];
  deck: any;
  board: BoardState;
  candidateActions: any[];
}): RecommendationResult {
  // Map standard AI profiles to role profiles if possible, 
  // but for simplicity we rely on the new engine.
  return buildRecommendationEngine({
    board: params.board,
    handCards: params.cardsMaster, // Simplified
    profiles: [], // Placeholder
    archetype: params.deck?.archetype,
  });
}

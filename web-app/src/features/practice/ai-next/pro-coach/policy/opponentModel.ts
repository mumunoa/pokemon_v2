import type {
  CoachBoardFeatures,
  CoachGameState,
  OpponentThreatInfo,
} from "../types";

function inferProbableHiddenCards(state: CoachGameState): string[] {
  const visible = new Set([
    ...(state.players.player2.hand ?? []).map((c) => c.name),
    ...(state.players.player2.discard ?? []).map((c) => c.name),
    ...(state.players.player2.bench ?? []).map((c) => c.name),
    state.players.player2.active?.name ?? "",
  ]);

  const candidates = ["ボスの指令", "ナンジャモ", "博士の研究", "いれかえ", "ポケモンいれかえ"];
  return candidates.filter((name) => !visible.has(name)).slice(0, 3);
}

export function evaluateOpponentThreat(
  features: CoachBoardFeatures,
  state: CoachGameState,
): OpponentThreatInfo {
  const opp = state.players.player2;
  const activeDamage = typeof opp.active?.damage === "number" ? opp.active.damage : 0;
  const activeCanAttack = Boolean(opp.active?.canAttack);
  const activeBase = activeCanAttack ? 180 : 110;
  const benchPressure = opp.bench.filter((c) => c.canAttack).length * 20;
  const systemPressure = features.oppSystemCount * 8;
  const requiredCards = activeCanAttack ? 1 : 2;

  const expectedMaxDamage = Math.max(
    60,
    activeBase + benchPressure + systemPressure - Math.min(30, activeDamage),
  );

  return {
    expectedMaxDamage,
    requiredCards,
    lethalThreat: expectedMaxDamage >= ((state.players.player1.active?.hp ?? 0) - (state.players.player1.active?.damage ?? 0)),
    disruptValue: Math.max(
      0,
      Math.min(100, 24 + features.oppSystemCount * 12 + (features.oppHeavyRetreatCount > 0 ? 14 : 0)),
    ),
    probableHiddenCards: inferProbableHiddenCards(state),
  };
}

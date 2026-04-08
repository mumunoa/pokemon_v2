import type { CoachBoardFeatures, CoachGameState, RiskReport } from "../types";

function clamp(num: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, num));
}

export function evaluateRisk(
  features: CoachBoardFeatures,
  state: CoachGameState,
): RiskReport {
  const me = state.players.player1;
  const handCollapseRisk = clamp(
    (me.hand.length <= 1 ? 48 : me.hand.length <= 3 ? 26 : 10) +
      (features.hasDrawInHand ? -12 : 8) +
      (features.hasSearchInHand ? -6 : 4),
  );

  const boardCollapseRisk = clamp(
    (features.ownBenchCount === 0 ? 55 : features.ownBenchCount === 1 ? 34 : 18) +
      (features.ownTwoPrizeExposed ? 18 : 0) +
      (features.activeCanAttack ? -8 : 6),
  );

  const energyStallRisk = clamp(
    (features.activeEnergyReady ? 12 : 36) +
      Math.max(0, features.activeEnergyNeeded - 1) * 12 +
      (state.players.player1.energyAttachedThisTurn ? 8 : 0),
  );

  const prizeRaceLossRisk = clamp(
    (features.ownPrizesRemaining > features.oppPrizesRemaining ? 34 : 16) +
      (features.activeCanAttack ? -6 : 10) +
      (features.gustNeed > 60 ? 8 : 0),
  );

  const comebackFailureRisk = clamp(
    (features.drawNeed > 60 ? 24 : 8) +
      (features.recoveryNeed > 60 ? 18 : 6) +
      (features.followupNeed > 60 ? 18 : 8),
  );

  const totalRiskScore = clamp(
    Math.round(
      handCollapseRisk * 0.18 +
        boardCollapseRisk * 0.24 +
        energyStallRisk * 0.18 +
        prizeRaceLossRisk * 0.22 +
        comebackFailureRisk * 0.18,
    ),
  );

  return {
    handCollapseRisk,
    boardCollapseRisk,
    energyStallRisk,
    prizeRaceLossRisk,
    comebackFailureRisk,
    totalRiskScore,
  };
}

import type { CoachBoardFeatures, CoachGameState, RiskReport } from "../types";

function clamp(num: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, num));
}

export function evaluateRisk(
  features: CoachBoardFeatures,
  state: CoachGameState,
  opponentThreat?: { expectedMaxDamage: number; lethalThreat: boolean }
): RiskReport {
  const me = state.players.player1;
  const deckRemaining = state.cards ? Object.keys(state.cards).length : 60; // Fallback or direct access if available

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

  // --- New Strategic Risks (Phase 11.8) ---
  // 山札切れリスク: 残り枚数が少なくなると指数関数的に上昇
  const actualDeckRemaining = (state as any).deckRemaining ?? 15; // Assume from state expansion
  const deckOutRisk = clamp(
    actualDeckRemaining <= 3 ? 90 :
    actualDeckRemaining <= 7 ? 65 :
    actualDeckRemaining <= 12 ? 35 : 5
  );

  // 重要札損失リスク: 手札の質が高い状況での手札破棄リスク
  const kcl = state.potentialKeyCardLoss ?? 0;
  const resourceLossRisk = clamp(
    (me.hand.length >= 7 ? 15 : 5) + 
    (features.drawNeed < 30 ? 10 : 0) +
    Math.min(50, Math.floor(kcl / 1.5)) // 重要札の価値をリスクに反映
  );
  
  // 詰めリスク (Checkmate Risk): 相手が次ターンにサイドを取り切る可能性
  const oppPrizes = features.oppPrizesRemaining;
  const lethalPotential = opponentThreat?.lethalThreat ? 60 : 0;
  const prizePressure = oppPrizes <= 1 ? 40 : oppPrizes <= 2 ? 20 : 0;
  
  const checkmateRisk = clamp(
    lethalPotential + prizePressure + (features.ownTwoPrizeExposed ? 15 : 0)
  );

  const totalRiskScore = clamp(
    Math.round(
      handCollapseRisk * 0.15 +
        boardCollapseRisk * 0.20 +
        energyStallRisk * 0.10 +
        prizeRaceLossRisk * 0.15 +
        comebackFailureRisk * 0.10 +
        deckOutRisk * 0.10 +
        checkmateRisk * 0.30 // 詰めリスクを最重視
    ),
  );

  return {
    handCollapseRisk,
    boardCollapseRisk,
    energyStallRisk,
    prizeRaceLossRisk,
    comebackFailureRisk,
    deckOutRisk,
    resourceLossRisk,
    checkmateRisk,
    totalRiskScore,
  };
}

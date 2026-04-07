import type { CoachBoardFeatures, CoachGameState, RiskReport } from "../types";

/**
 * blueprint.md 第8章に基づき、現在の負け筋（リスク）を定量化する
 */
export function evaluateRisk(features: CoachBoardFeatures, state: CoachGameState): RiskReport {
  const {
    drawNeed,
    setupNeed,
    safetyNeed,
    tempoNeed,
    recoveryNeed,
    ownPrizesRemaining,
    oppPrizesRemaining
  } = features;

  // 1. 手札枯渇リスク
  // 手札が少なく、ドローソースもない場合に高まる
  const handCollapseRisk = Math.min(100, (drawNeed * 0.8) + (state.players.player1.hand.length < 3 ? 30 : 0));

  // 2. 盤面崩壊リスク
  // 後続がいない、またはバトル場の耐久が不安な場合に高まる
  const boardCollapseRisk = Math.min(100, (setupNeed * 0.7) + (safetyNeed > 60 ? 40 : 10));

  // 3. エネ供給停止リスク
  const energyStallRisk = Math.min(100, (features.activeEnergyNeeded > 0 ? 40 : 0) + (recoveryNeed * 0.5));

  // 4. サイドレース敗北リスク
  // 相手の方が勝ちに近い場合
  const prizeRaceLossRisk = Math.min(100, (oppPrizesRemaining < ownPrizesRemaining ? 50 : 0) + (safetyNeed * 0.5));

  // 5. 総合リスクスコア (加重平均)
  const totalRiskScore = Math.floor(
    (handCollapseRisk * 0.3) + 
    (boardCollapseRisk * 0.3) + 
    (prizeRaceLossRisk * 0.4)
  );

  return {
    handCollapseRisk: Math.floor(handCollapseRisk),
    boardCollapseRisk: Math.floor(boardCollapseRisk),
    energyStallRisk: Math.floor(energyStallRisk),
    prizeRaceLossRisk: Math.floor(prizeRaceLossRisk),
    comebackFailureRisk: Math.floor(recoveryNeed),
    totalRiskScore
  };
}

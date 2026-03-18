import type { BoardState } from "../domain/types";

export type BoardUrgencyProfile = {
  needSetupNow: number;
  needDrawNow: number;
  needGustNow: number;
  needRecoveryNow: number;
  needSwitchNow: number;
  needStallNow: number;
  needEnergyNow: number;
  canPushPrizeNow: number;
  setupDeficit: number;
  prizePressure: number;
  trapOpportunity: number;
  systemTargetValue: number;
  handStability: number;
  resourceRisk: number;
  attackReadiness: number;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function buildBoardUrgencyProfile(board: BoardState): BoardUrgencyProfile {
  const benchCount = board.bench.length;
  const activeReady = board.active ? (board.active.canAttack ? 1 : 0) : 0;
  const activeEnergy = board.active?.energies ?? 0;
  const heavyRetreatOpponent = board.opponentBench.some((card) => (card.retreat ?? 0) >= 2);
  const systemTargets = board.opponentBench.filter((card) => card.isSystem).length;
  const drawLikeInHand = board.hand.filter((name) =>
    ["博士の研究", "ナンジャモ", "ジャッジマン", "リーリエの決心", "暗号マニアの解読"].includes(name),
  ).length;

  const setupDeficit = clamp((3 - benchCount) * 20 + (activeReady ? 0 : 20));
  const prizePressure = clamp(
    (board.opponentActive?.damage ?? 0) > 0 ? 60 : 30 + board.prizesTakenByPlayer * 5,
  );
  const trapOpportunity = clamp((heavyRetreatOpponent ? 55 : 15) + (board.knownOpponentSwitchOuts === 0 ? 20 : 0));
  const systemTargetValue = clamp(systemTargets * 25);
  const handStability = clamp(100 - drawLikeInHand * 20 - board.hand.length * 5);
  const resourceRisk = clamp((10 - board.deckRemaining) * 6 + board.discard.length);
  const attackReadiness = clamp(activeReady * 70 + activeEnergy * 10);

  return {
    needSetupNow: clamp(setupDeficit + (benchCount <= 1 ? 20 : 0)),
    needDrawNow: clamp(handStability + (board.hand.length <= 3 ? 20 : 0)),
    needGustNow: clamp(prizePressure + systemTargetValue / 2),
    needRecoveryNow: clamp(resourceRisk / 2 + (board.active && board.active.damage > 80 ? 25 : 0)),
    needSwitchNow: clamp((board.active && (board.active.retreat ?? 0) >= 2 ? 45 : 10) + (activeReady ? 0 : 20)),
    needStallNow: clamp(trapOpportunity + (board.prizesTakenByOpponent > board.prizesTakenByPlayer ? 15 : 0)),
    needEnergyNow: clamp(activeEnergy === 0 ? 70 : activeEnergy === 1 ? 45 : 20),
    canPushPrizeNow: clamp(prizePressure + attackReadiness / 2),
    setupDeficit,
    prizePressure,
    trapOpportunity,
    systemTargetValue,
    handStability,
    resourceRisk,
    attackReadiness,
  };
}

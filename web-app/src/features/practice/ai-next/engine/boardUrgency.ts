import type { BoardState } from "../domain/types";

export type GamePhase = "opening" | "midgame" | "endgame";

export type PrizeMapPressure = {
  playerPrizesRemaining: number;
  opponentPrizesRemaining: number;
  canTakeOnePrizeNow: boolean;
  canTakeTwoPrizeNow: boolean;
  opponentCanTakeTwoPrizeNext: boolean;
};

export type BoardUrgencyProfile = {
  phase: GamePhase;
  needSetupNow: number;
  needDrawNow: number;
  needGustNow: number;
  needRecoveryNow: number;
  needSwitchNow: number;
  needStallNow: number;
  needEnergyNow: number;
  canPushPrizeNow: number;
  protectTwoPrizeNow: number;
  systemPunishValue: number;
  tempoCatchupValue: number;
  prizeMap: PrizeMapPressure;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function inferPhase(board: BoardState): GamePhase {
  const totalTaken = board.prizesTakenByPlayer + board.prizesTakenByOpponent;
  if (totalTaken <= 2) return "opening";
  if (totalTaken <= 7) return "midgame";
  return "endgame";
}

export function buildPrizeMap(board: BoardState): PrizeMapPressure {
  const playerRemaining = 6 - board.prizesTakenByPlayer;
  const opponentRemaining = 6 - board.prizesTakenByOpponent;
  const opponentActiveDamage = board.opponentActive?.damage ?? 0;
  const opponentActiveHp = board.opponentActive?.hp ?? 999;
  const canTakeOnePrizeNow = opponentActiveHp - opponentActiveDamage <= 120;
  const canTakeTwoPrizeNow = opponentActiveHp - opponentActiveDamage <= 240;
  const opponentCanTakeTwoPrizeNext =
    !!board.active && ((board.active.hp ?? 999) - board.active.damage <= 240);

  return {
    playerPrizesRemaining: playerRemaining,
    opponentPrizesRemaining: opponentRemaining,
    canTakeOnePrizeNow,
    canTakeTwoPrizeNow,
    opponentCanTakeTwoPrizeNext,
  };
}

export function buildBoardUrgencyProfile(board: BoardState): BoardUrgencyProfile {
  const phase = inferPhase(board);
  const prizeMap = buildPrizeMap(board);
  const benchCount = board.bench.length;
  const activeReady = board.active?.canAttack ? 1 : 0;
  const activeEnergy = board.active?.energies ?? 0;
  const heavyRetreatTargets = board.opponentBench.filter((p) => (p.retreat ?? 0) >= 2).length;
  const systemTargets = board.opponentBench.filter((p) => p.isSystem).length;
  const drawNeed = board.hand.length <= 3 ? 75 : board.hand.length <= 5 ? 48 : 20;

  const setupNeedBase =
    phase === "opening"
      ? (benchCount <= 1 ? 80 : benchCount === 2 ? 55 : 25)
      : (activeReady ? 20 : 45);

  const needSetupNow = clamp(setupNeedBase + (activeReady ? 0 : 15));
  const needDrawNow = clamp(drawNeed + (board.deckRemaining <= 10 ? 10 : 0));
  const needGustNow = clamp(
    (prizeMap.canTakeTwoPrizeNow ? 65 : prizeMap.canTakeOnePrizeNow ? 35 : 10) +
      systemTargets * 12 +
      (phase === "endgame" ? 20 : 0),
  );
  const needRecoveryNow = clamp(
    (board.active && board.active.damage >= 100 ? 45 : 10) +
      (board.discard.length >= 8 ? 15 : 0) +
      (phase === "midgame" ? 10 : 0),
  );
  const needSwitchNow = clamp(
    (!!board.active && (board.active.retreat ?? 0) >= 2 ? 45 : 10) +
      (!activeReady ? 20 : 0),
  );
  const needStallNow = clamp(
    heavyRetreatTargets * 15 +
      (board.prizesTakenByOpponent > board.prizesTakenByPlayer ? 20 : 5) +
      (phase === "endgame" ? 18 : 0),
  );
  const needEnergyNow = clamp(activeEnergy === 0 ? 70 : activeEnergy === 1 ? 45 : 20);
  const canPushPrizeNow = clamp(
    (prizeMap.canTakeTwoPrizeNow ? 90 : prizeMap.canTakeOnePrizeNow ? 65 : 20) +
      systemTargets * 8,
  );
  const protectTwoPrizeNow = clamp(prizeMap.opponentCanTakeTwoPrizeNext ? 80 : 25);
  const systemPunishValue = clamp(systemTargets * 22);
  const tempoCatchupValue = clamp(
    (board.prizesTakenByOpponent > board.prizesTakenByPlayer ? 45 : 15) +
      heavyRetreatTargets * 10,
  );

  return {
    phase,
    needSetupNow,
    needDrawNow,
    needGustNow,
    needRecoveryNow,
    needSwitchNow,
    needStallNow,
    needEnergyNow,
    canPushPrizeNow,
    protectTwoPrizeNow,
    systemPunishValue,
    tempoCatchupValue,
    prizeMap,
  };
}

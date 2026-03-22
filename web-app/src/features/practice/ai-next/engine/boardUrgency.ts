import type { BoardState, CardRoleProfile } from "../domain/types";

export type GamePhase = "opening" | "midgame" | "endgame";

export type PrizeMapPressure = {
  playerPrizesRemaining: number;
  opponentPrizesRemaining: number;
  canTakeOnePrizeNow: boolean;
  canTakeTwoPrizeNow: boolean;
  opponentCanTakeTwoPrizeNext: boolean;
};

export type ReachabilityContext = {
  canBenchThisTurn: number;
  canFindDrawThisTurn: number;
  canFindEnergyThisTurn: number;
  canPrepareMainAttackerNextTurn: number;
  hasImmediateDrawSupport: boolean;
  hasImmediateBenchAccess: boolean;
  hasImmediateEnergyAccess: boolean;
};

export type BoardUrgencyBuildContext = {
  handCards?: Array<{ name: string }>;
  profiles?: CardRoleProfile[];
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
  reachability: ReachabilityContext;
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

function countRoles(
  handCards: Array<{ name: string }>,
  profiles: CardRoleProfile[] | undefined,
  wanted: string[],
): number {
  if (!profiles?.length || !handCards.length) return 0;
  const names = new Set(handCards.map((card) => card.name));
  return profiles.filter((profile) => {
    if (!names.has(profile.cardName)) return false;
    return wanted.some((role) => profile.staticRoles.includes(role as never));
  }).length;
}

function buildReachabilityContext(
  board: BoardState,
  ctx?: BoardUrgencyBuildContext,
): ReachabilityContext {
  const handCards = ctx?.handCards ?? board.hand.map((name) => ({ name }));
  const benchAccess = countRoles(handCards, ctx?.profiles, ["bench_setup", "seed_search_item", "search"]);
  const drawAccess = countRoles(handCards, ctx?.profiles, ["draw", "draw_support", "search_support"]);
  const energyAccess = countRoles(handCards, ctx?.profiles, ["energy", "energy_search", "energy_accel", "energy_search_item"]);
  const evolutionAccess = countRoles(handCards, ctx?.profiles, ["rare_candy", "evolution", "search", "topdeck_tutor"]);

  const activeEnergy = board.active?.energies ?? 0;

  return {
    canBenchThisTurn: clamp(benchAccess * 2 + (board.bench.length < 2 ? 1 : 0), 0, 4),
    canFindDrawThisTurn: clamp(drawAccess, 0, 3),
    canFindEnergyThisTurn: clamp(energyAccess + (activeEnergy > 0 ? 1 : 0), 0, 3),
    canPrepareMainAttackerNextTurn: clamp(evolutionAccess + benchAccess, 0, 4),
    hasImmediateDrawSupport: drawAccess > 0,
    hasImmediateBenchAccess: benchAccess > 0,
    hasImmediateEnergyAccess: energyAccess > 0 || activeEnergy > 0,
  };
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

export function buildBoardUrgencyProfile(
  board: BoardState,
  ctx?: BoardUrgencyBuildContext,
): BoardUrgencyProfile {
  const phase = inferPhase(board);
  const prizeMap = buildPrizeMap(board);
  const benchCount = board.bench.length;
  const activeReady = board.active?.canAttack ? 1 : 0;
  const activeEnergy = board.active?.energies ?? 0;
  const heavyRetreatTargets = board.opponentBench.filter((p) => (p.retreat ?? 0) >= 2).length;
  const systemTargets = board.opponentBench.filter((p) => p.isSystem).length;
  const reachability = buildReachabilityContext(board, ctx);

  const baseDrawNeed = board.hand.length <= 3 ? 75 : board.hand.length <= 5 ? 48 : 20;
  const drawReachabilityDiscount =
    reachability.hasImmediateDrawSupport ? 28 : reachability.canFindDrawThisTurn > 0 ? 16 : 0;

  const setupNeedBase =
    phase === "opening"
      ? (benchCount <= 1 ? 80 : benchCount === 2 ? 55 : 25)
      : activeReady ? 20 : 45;

  const setupReachabilityDiscount =
    reachability.canBenchThisTurn >= 2 ? 30 :
    reachability.canBenchThisTurn >= 1 ? 16 : 0;

  const energyReachabilityDiscount =
    reachability.hasImmediateEnergyAccess ? 24 :
    reachability.canFindEnergyThisTurn > 0 ? 12 : 0;

  const futureAttackerDiscount =
    reachability.canPrepareMainAttackerNextTurn >= 2 ? 14 :
    reachability.canPrepareMainAttackerNextTurn >= 1 ? 7 : 0;

  const needSetupNow = clamp(
    setupNeedBase + (activeReady ? 0 : 15) - setupReachabilityDiscount - futureAttackerDiscount,
  );
  const needDrawNow = clamp(baseDrawNeed + (board.deckRemaining <= 10 ? 10 : 0) - drawReachabilityDiscount);
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
  const needEnergyNow = clamp((activeEnergy === 0 ? 70 : activeEnergy === 1 ? 45 : 20) - energyReachabilityDiscount);
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
    reachability,
  };
}

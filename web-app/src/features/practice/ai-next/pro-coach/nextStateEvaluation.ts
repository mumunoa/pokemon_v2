import type { CardRoleProfile } from "../domain/types";
import type { CoachGameState, NextStateEvaluation } from "./types";
import { extractBoardFeatures } from "./featureExtractor";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function evaluateNextState(
  state: CoachGameState,
  handProfiles: CardRoleProfile[],
  archetype: string,
): NextStateEvaluation {
  const f = extractBoardFeatures(state, handProfiles);
  const me = state.players.player1;
  const opp = state.players.player2;

  const setup = clamp(
    (f.ownBenchCount >= 2 ? 34 : f.ownBenchCount * 12) +
      (f.activeCanAttack ? 20 : f.activeEnergyCount >= 1 ? 8 : 0) +
      (f.hasDrawInHand ? 12 : 0) +
      (f.hasSearchInHand ? 16 : 0),
  );

  const prizeMap = clamp(
    (f.ownPrizesRemaining < f.oppPrizesRemaining ? 24 : f.ownPrizesRemaining === f.oppPrizesRemaining ? 14 : 8) +
      (((opp.active?.hp ?? 999) - (opp.active?.damage ?? 0) <= 120) ? 16 : 0) +
      (f.phase === "endgame" ? 12 : 0),
  );

  const tempo = clamp(
    (f.activeEnergyReady ? 25 : f.activeEnergyNeeded === 1 ? 12 : 4) +
      (f.canRetreat || f.hasFreePivot ? 18 : 0) +
      (f.oppSystemCount === 0 ? 12 : 0),
  );

  const threat = clamp(
    (f.ownTwoPrizeExposed ? 8 : 20) +
      (f.recoveryNeed < 20 ? 12 : 0) +
      (f.safetyNeed < 40 ? 10 : 0) +
      (!f.canRetreat && f.safetyNeed > 60 ? -15 : 0), // 逃げられないのに危険な状況へのペナルティ
  );

  const resources = clamp(
    me.hand.length * 3 +
      (f.hasDrawInHand ? 8 : 0) +
      (f.hasSearchInHand ? 8 : 0) +
      (me.discard.length >= 6 ? 5 : 0),
  );

  const followup = clamp(
    (f.ownBenchCount >= 3 ? 18 : 8) +
      (f.activeEnergyNeeded <= 1 ? 12 : 0) +
      (f.phase === "opening" ? 10 : 6),
  );

  const reasons: string[] = [];
  if (f.ownBenchCount < 2) reasons.push("ベンチ基盤がまだ不足しています。");
  if (!f.activeEnergyReady) {
    reasons.push(`攻撃準備にあと ${f.activeEnergyNeeded} 枚のエネルギーが必要です。`);
  } else {
    reasons.push("メインアタッカーの攻撃準備が完了しています。");
  }
  if (!f.canRetreat && !f.hasFreePivot) {
    reasons.push(`現在のバトルポケモン（逃げエネ ${f.activeRetreatCost}）を逃がすリソースが不足しています。`);
  }
  if (f.hasFreePivot) reasons.push("逃げエネ0のポケモンがベンチに控えており、柔軟な入れ替えが可能です。");
  if (f.oppSystemCount > 0) reasons.push("相手システムを触る価値があります。");
  if (f.hasDrawInHand) reasons.push("継続的な手札更新手段があります。");
  if (f.hasSearchInHand) reasons.push("必要札へ到達できる見込みがあります。");

  const total = clamp(setup + prizeMap + tempo + threat + resources + followup, 0, 500);

  return {
    total,
    setup,
    prizeMap,
    tempo,
    threat,
    resources,
    followup,
    reasons,
  };
}

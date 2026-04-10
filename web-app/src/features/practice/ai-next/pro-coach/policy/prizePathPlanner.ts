import type { CardRoleProfile } from "../../domain/types";
import type { CoachBoardFeatures, CoachGameState, PrizePlan, PrizeTargetStep, CoachCard } from "../types";

/**
 * プロフェッショナル・サイドプランナー
 * 相手の盤面から、どのポケモンを倒してサイドを取り切るかの最短ルートを算出します。
 */

function ownPrizesRemaining(state: CoachGameState): number {
  return Math.max(0, 6 - state.players.player1.prizesTaken);
}

// ポケモンが持っているサイド枚数を判定
function getPrizesForPokemon(pokemon: CoachCard): number {
  const name = (pokemon.name || "").toUpperCase();
  const tags = (pokemon.tags || []).map(t => t.toUpperCase());
  
  // 3枚取りの判定
  if (name.includes("VMAX") || name.includes("V-UNION") || tags.includes("VMAX")) return 3;
  
  // 2枚取りの判定
  if (name.includes("EX") || name.includes("VSTAR") || name.endsWith(" V") || name.includes(" V ") || 
      tags.includes("EX") || tags.includes("VSTAR") || tags.includes("V") || tags.includes("GX")) {
    return 2;
  }
  
  // デフォルト 1枚
  return 1;
}

function inferPattern(remaining: number): number[] {
  if (remaining <= 1) return [1];
  if (remaining === 2) return [2];
  if (remaining === 3) return [2, 1];
  if (remaining === 4) return [2, 2];
  if (remaining === 5) return [2, 2, 1];
  return [2, 2, 2];
}

function buildTargetSequence(
  state: CoachGameState,
  pattern: number[],
): PrizeTargetStep[] {
  const oppActive = state.players.player2.active;
  const oppBench = state.players.player2.bench;
  const targets: PrizeTargetStep[] = [];

  pattern.forEach((prizes, index) => {
    // パターンの枚数に合致するターゲットを探す
    let found = false;
    
    // まずバトル場をチェック
    if (oppActive && getPrizesForPokemon(oppActive) === prizes) {
      targets.push({ targetName: oppActive.name, prizes, isRequired: index === 0 });
      found = true;
    }
    
    // 次にベンチをチェック
    if (!found) {
      const target = oppBench.find(c => getPrizesForPokemon(c) === prizes);
      if (target) {
        targets.push({ targetName: target.name, prizes, isRequired: index === 0 });
        found = true;
      }
    }
    
    // 見つからない場合はフォールバック
    if (!found) {
      const fallback = prizes >= 2 ? (oppActive?.name || "ルール持ち") : (oppBench[0]?.name || oppActive?.name || "たねポケモン");
      targets.push({ targetName: fallback, prizes, isRequired: index === 0 });
    }
  });

  return targets;
}

export function planPrizePath(
  features: CoachBoardFeatures,
  state: CoachGameState,
  profiles: CardRoleProfile[],
): PrizePlan {
  const remaining = ownPrizesRemaining(state);
  const pattern = inferPattern(remaining);
  const targetSequence = buildTargetSequence(state, pattern);

  const hasGust = profiles.some((p) => p.staticRoles.includes("gust"));
  const hasRecovery = profiles.some((p) => p.staticRoles.includes("recovery"));
  
  // 完遂成功率の計算（より現実的な係数に調整）
  const successProbability = Math.max(
    15,
    Math.min(
      95,
      50
        + (features.activeCanAttack ? 15 : 0)
        + (features.hasSearchInHand ? 10 : 0)
        + (features.hasDrawInHand ? 5 : 0)
        + (hasGust ? 10 : -5) // グストがなければ難しい
        - Math.round(features.safetyNeed * 0.2)
        - Math.round(features.setupNeed * 0.1),
    ),
  );

  const fragilityScore = Math.max(
    5,
    Math.min(
      95,
      30
        + (features.ownTwoPrizeExposed ? 25 : 0)
        + Math.round(features.safetyNeed * 0.25)
        + (features.ownBenchCount <= 1 ? 15 : 0)
        - (features.hasRecoveryInHand ? 10 : 0),
    ),
  );

  // 完遂に必要な期待ターン数（サイド差だけでなく準備状況も加味）
  const estimatedTurnsToFinish = Math.max(
    1,
    Math.min(
      6,
      Math.ceil(remaining / Math.max(1, features.activeCanAttack ? (pattern[0] || 1) : 0.5)) +
        (features.activeEnergyReady ? 0 : 1)
    ),
  );

  return {
    id: `plan_${pattern.join("-")}`,
    pattern,
    targetSequence,
    estimatedTurnsToFinish,
    successProbability,
    fragilityScore,
  };
}

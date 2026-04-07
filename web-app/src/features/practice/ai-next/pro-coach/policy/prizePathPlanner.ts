import type { CoachBoardFeatures, CoachGameState, PrizePlan, PrizeTargetStep } from "../types";
import type { CardRoleProfile } from "../../domain/types";

/**
 * blueprint.md 第4章に基づき、サイドの取り切りルート（Prizeプラン）を算出する
 */
export function planPrizePath(
  features: CoachBoardFeatures,
  state: CoachGameState,
  profiles: CardRoleProfile[]
): PrizePlan {
  const oppActive = state.players.player2.active;
  const oppBench = state.players.player2.bench;
  const ownPrizes = features.ownPrizesRemaining;

  // 1. 相手の場のターゲットを解析
  const allTargets = [oppActive, ...oppBench].filter(Boolean).map(p => {
    const isExOrV = p?.hp && p.hp >= 190; // 粗い判定だがex/Vを想定
    const isBig = p?.hp && p.hp >= 280;   // 2進化exやVMAXを想定
    return {
      name: p?.name || "不明",
      prizes: isBig ? 3 : isExOrV ? 2 : 1,
      hp: p?.hp || 0
    };
  });

  // 2. サイドプランの探索 (簡易版)
  // TODO: より高度な全探索も可能だが、まずは代表的な [2, 2, 2] 等を優先
  let selectedPattern: number[] = [];
  let targetSequence: PrizeTargetStep[] = [];
  let currentPrizes = 0;

  // 優先順位: 効率的な2枚取り -> 1枚取り
  const sortedTargets = [...allTargets].sort((a, b) => b.prizes - a.prizes);

  for (const target of sortedTargets) {
    if (currentPrizes >= ownPrizes) break;
    
    currentPrizes += target.prizes;
    selectedPattern.push(target.prizes);
    targetSequence.push({
      targetName: target.name,
      prizes: target.prizes,
      isRequired: true
    });
  }

  // 3. 推測メトリクスの算出
  const estimatedTurns = Math.ceil(ownPrizes / (selectedPattern[0] || 1));
  const successProbability = 100 - (targetSequence.length * 10); // ターゲットが多いほど不確実

  return {
    id: `plan-${selectedPattern.join("-")}`,
    pattern: selectedPattern,
    targetSequence,
    estimatedTurnsToFinish: estimatedTurns,
    successProbability: Math.max(10, successProbability),
    fragilityScore: features.safetyNeed > 50 ? 60 : 20, // 相手の妨害プレッシャーが高いと崩れやすい
  };
}

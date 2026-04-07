import type { CoachBoardFeatures, CoachGameState, TurnGoal, TurnGoalType } from "../types";

/**
 * blueprint.md 第3章に基づき、このターンの役割（ゴール）を決定する
 */
export function planTurnGoal(features: CoachBoardFeatures, state: CoachGameState): TurnGoal {
  const {
    ownPrizesRemaining,
    oppPrizesRemaining,
    activeCanAttack,
    activeEnergyReady,
    setupNeed,
    safetyNeed,
    tempoNeed,
    drawNeed,
  } = features;

  // 1. 詰めターン (Checkmate)
  // 自分がサイドを1〜2枚取れば勝ちで、攻撃可能な場合
  if (ownPrizesRemaining <= 2 && activeCanAttack && activeEnergyReady) {
    return {
      type: "checkmate",
      primaryReason: "勝ち筋が確定しています。サイドの取り切りを最優先します。",
      requiredOutcome: ["バトル場のきぜつ", "またはベンチの呼び出し"],
    };
  }

  // 2. 耐久・妨害要求 (Stall / Disrupt)
  // 相手のサイドが少なく、リーサル脅威が高い場合
  if (oppPrizesRemaining <= 2 && safetyNeed > 70) {
    return {
      type: "stall",
      primaryReason: "相手のリーサルが目前です。負け筋を消し、相手の要求値を上げる動きが必要です。",
      requiredOutcome: ["HPの高い壁出し", "手札干渉サポート", "エネ破壊等"],
    };
  }

  // 3. 攻撃成立ターン (Attack)
  // 盤面が整っており、サイドを先行 or 追いつける状況
  if (activeCanAttack && activeEnergyReady && tempoNeed > 50) {
    return {
      type: "attack",
      primaryReason: "攻撃体制が整っています。テンポを維持しつつサイドレースを進めます。",
      requiredOutcome: ["メインアタッカーでの攻撃", "打点補助の適用"],
    };
  }

  // 4. 盤面形成ターン (Setup)
  // たねポケモンが不足している、または進化が必要な序盤中盤
  if (setupNeed > 60 || drawNeed > 70) {
    return {
      type: "setup",
      primaryReason: "盤面の完成度が低いため、このターンは無理な攻撃より展開を優先します。",
      requiredOutcome: ["たねポケモンの展開", "進化ラインの確保", "ドローソースの起動"],
    };
  }

  // 5. リソース回復ターン (Recover / Stabilize)
  // 手札が細い、またはエネが枯渇している場合
  if (drawNeed > 50 || features.recoveryNeed > 60) {
    return {
      type: "recover",
      primaryReason: "リソースが不足しています。次ターンの継続性を重視した動きを取ります。",
      requiredOutcome: ["手札更新", "トラッシュからの回収"],
    };
  }

  // 6. デフォルト: 再現性最大化
  return {
    type: "stabilize",
    primaryReason: "明確な危機やチャンスはありません。勝ち筋を維持するための盤面固定を行います。",
    requiredOutcome: ["エネルギーの先貼り", "盤面圧縮", "山札の確認"],
  };
}

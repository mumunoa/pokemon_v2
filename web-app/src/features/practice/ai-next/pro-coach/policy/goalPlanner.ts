import type { CoachBoardFeatures, CoachGameState, TurnGoal } from "../types";

/**
 * プロフェッショナル・ゴールプランナー
 * 盤面の特徴量（Features）とゲームの状態（State）から、今ターンの最優先目標を決定します。
 */

function ownPrizesRemaining(state: CoachGameState): number {
  return Math.max(0, 6 - state.players.player1.prizesTaken);
}

function oppPrizesRemaining(state: CoachGameState): number {
  return Math.max(0, 6 - state.players.player2.prizesTaken);
}

export function planTurnGoal(
  features: CoachBoardFeatures,
  state: CoachGameState,
): TurnGoal {
  const ownRemain = ownPrizesRemaining(state);
  const oppRemain = oppPrizesRemaining(state);
  const currentTurn = state.turn || 1;

  // 1. リーサル（詰め）判定
  if (features.canKOActiveThisTurn && (ownRemain <= 1 || (ownRemain <= 2 && features.oppPrizesRemaining > 2))) {
    return {
      type: "checkmate",
      primaryReason: "今ターンの攻撃で勝利、あるいは決定的なサイド差をつけられる「詰め」の局面です。",
      requiredOutcome: ["attack_now", "avoid_throwing", "confirm_lethal"],
    };
  }

  // 2. 先行/後攻 特化ロジック (Blueprint 13章)
  if (currentTurn === 1) {
    // 先行1ターン目：攻撃不可のため展開に全振り
    return {
      type: "setup",
      primaryReason: "先行1ターン目です。次ターン以降の爆発力を担保するため、盤面の基盤作成を最優先します。",
      requiredOutcome: ["build_attacker", "secure_bench", "energy_to_main"],
    };
  }
  
  if (currentTurn === 2 && !features.activeCanAttack) {
    // 後攻1ターン目(turn=2)で攻撃準備ができていない場合、妨害か展開
    if (features.hasSearchInHand || features.ownBenchCount <= 2) {
      return {
        type: "setup",
        primaryReason: "後攻1ターン目ですが、攻撃準備が整っていません。まずは盤面を整える必要があります。",
        requiredOutcome: ["bench_setup", "prepare_energy"],
      };
    }
  }

  // 3. リスク（負け筋回避）優先
  if (features.safetyNeed >= 75 || (oppRemain <= 2 && !features.activeEnergyReady)) {
    return {
      type: "stall",
      primaryReason: "相手の返しが非常に重く、まず負け筋（サイド2枚取り等）を減らす必要があります。",
      requiredOutcome: ["reduce_reply", "protect_two_prize", "stabilize_board"],
    };
  }

  // 4. 攻勢（サイド取得優先）
  if (features.canKOActiveThisTurn || (features.activeCanAttack && features.activeEnergyReady)) {
    return {
      type: "attack",
      primaryReason: "攻撃を通しながらテンポを取り、サイドレースで優位に立てるターンです。",
      requiredOutcome: ["take_prize_or_force_reply", "maintain_followup"],
    };
  }

  // 5. 展開（盤面形成優先）
  if (features.setupNeed >= 65 || (!features.activeCanAttack && features.ownBenchCount <= 2)) {
    return {
      type: "setup",
      primaryReason: "今ターンは無理に押し込むより、アタッカーの育成と盤面形成が優先です。",
      requiredOutcome: ["build_attacker", "secure_bench", "improve_draw_access"],
    };
  }

  // 6. 妨害（テンポ奪取）
  if (features.gustNeed >= 70 && features.hasGustInHand) {
    return {
      type: "disrupt",
      primaryReason: "相手の盤面のシステムポケモンを崩し、相手のプランを遅延させる価値が高いです。",
      requiredOutcome: ["deny_system", "force_bad_active", "distort_prize_trade"],
    };
  }

  // 7. リソース回復
  if (features.recoveryNeed >= 65 && features.hasRecoveryInHand) {
    return {
      type: "recover",
      primaryReason: "トラッシュのリソースを回収し、長期戦に向けた粘りを作るべきターンです。",
      requiredOutcome: ["recover_core_piece", "improve_followup", "resource_management"],
    };
  }

  // 8. デフォルト：安定化
  return {
    type: "stabilize",
    primaryReason: "特定の強いコンセプトがないため、手札と盤面の質を高めて次ターンの成功率を上げます。",
    requiredOutcome: ["increase_consistency", "avoid_overextend", "retain_resources"],
  };
}

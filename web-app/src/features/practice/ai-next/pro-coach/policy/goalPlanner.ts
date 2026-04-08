import type { CoachBoardFeatures, CoachGameState, TurnGoal } from "../types";

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

  if (ownRemain <= 2 && features.activeCanAttack) {
    return {
      type: "checkmate",
      primaryReason: "今ターンの攻撃成立がそのまま詰め筋に直結しやすい局面です。",
      requiredOutcome: ["attack_now", "preserve_followup", "avoid_throwing"],
    };
  }

  if (features.safetyNeed >= 75 || (oppRemain <= 2 && !features.activeEnergyReady)) {
    return {
      type: "stall",
      primaryReason: "相手の返しが重く、まず負け筋を減らす必要があります。",
      requiredOutcome: ["reduce_reply", "protect_two_prize", "stabilize_board"],
    };
  }

  if (features.setupNeed >= 65 || (!features.activeCanAttack && features.ownBenchCount <= 1)) {
    return {
      type: "setup",
      primaryReason: "今ターンは無理に押し込むより、次ターン以降の勝ち筋形成が優先です。",
      requiredOutcome: ["build_attacker", "secure_bench", "improve_draw_access"],
    };
  }

  if (features.gustNeed >= 70 && features.hasGustInHand) {
    return {
      type: "disrupt",
      primaryReason: "相手の盤面の要所を崩す価値が高いターンです。",
      requiredOutcome: ["deny_system", "force_bad_active", "distort_prize_trade"],
    };
  }

  if (features.recoveryNeed >= 65 && features.hasRecoveryInHand) {
    return {
      type: "recover",
      primaryReason: "今は盤面の継続性とリソース寿命を戻すべきターンです。",
      requiredOutcome: ["recover_core_piece", "improve_followup", "avoid_hand_collapse"],
    };
  }

  if (features.activeCanAttack && features.activeEnergyReady) {
    return {
      type: "attack",
      primaryReason: "攻撃を通しながら主導権を取れるターンです。",
      requiredOutcome: ["take_prize_or_force_reply", "maintain_followup"],
    };
  }

  return {
    type: "stabilize",
    primaryReason: "最大値よりも再現性を取り、次ターンの成功率を上げるターンです。",
    requiredOutcome: ["increase_consistency", "avoid_overextend", "retain_resources"],
  };
}

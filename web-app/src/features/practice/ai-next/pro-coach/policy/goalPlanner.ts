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
      primaryReason: "ここは勝利を決定づける「詰め」の局面です。リソースの出し惜しみをせず、確実にサイドを取り切るルートを優先してください。",
      requiredOutcome: ["attack_now", "avoid_throwing", "confirm_lethal"],
    };
  }

  // 2. 先行/後攻 特化ロジック (Blueprint 13章)
  if (currentTurn === 1) {
    // 先行1ターン目：攻撃不可のため展開に全振り
    return {
      type: "setup",
      primaryReason: "先行1ターン目の定石として、盤面の基盤作りを最優先します。次ターンの進化やエネ貼りをスムーズにするための準備が肝要です。",
      requiredOutcome: ["build_attacker", "secure_bench", "energy_to_main"],
    };
  }
  
  if (currentTurn === 2 && !features.activeCanAttack) {
    // 後攻1ターン目(turn=2)で攻撃準備ができていない場合、妨害か展開
    if (features.hasSearchInHand || features.ownBenchCount <= 2) {
      return {
        type: "setup",
        primaryReason: "後攻1ターン目ですが、速攻は難しい状況です。無理に攻めず、中盤以降の捲りを見据えてベンチを厚くするべき場面です。",
        requiredOutcome: ["bench_setup", "prepare_energy"],
      };
    }
  }

  // 3. リスク（負け筋回避）優先
  if (features.safetyNeed >= 75 || (oppRemain <= 2 && !features.activeEnergyReady)) {
    return {
      type: "stall",
      primaryReason: "相手のリーサルが近く、非常に危険な盤面です。まずは返しで負けないための「負け筋を消す」行動を最優先してください。",
      requiredOutcome: ["reduce_reply", "protect_two_prize", "stabilize_board"],
    };
  }

  // 4. 攻勢（サイド取得優先）
  if (features.canKOActiveThisTurn || (features.activeCanAttack && features.activeEnergyReady)) {
    return {
      type: "attack",
      primaryReason: "サイドプランを優位に進めるチャンスです。攻撃を通してテンポを取りつつ、相手の盤面に圧力をかけていきます。",
      requiredOutcome: ["take_prize_or_force_reply", "maintain_followup"],
    };
  }

  // 5. 展開（盤面形成優先）
  if (features.setupNeed >= 65 || (!features.activeCanAttack && features.ownBenchCount <= 2)) {
    return {
      type: "setup",
      primaryReason: "今は強引に攻めるよりも、アタッカーの育成と再現性の確保を優先するべき「作る」ターンです。",
      requiredOutcome: ["build_attacker", "secure_bench", "improve_draw_access"],
    };
  }

  // 6. 妨害（テンポ奪取）
  if (features.gustNeed >= 70 && features.hasGustInHand) {
    return {
      type: "disrupt",
      primaryReason: "相手のシステムポケモンの機能を停止させ、勝ち筋を遅らせる価値が高い局面です。妨害を絡めて主導権を引き戻します。",
      requiredOutcome: ["deny_system", "force_bad_active", "distort_prize_trade"],
    };
  }

  // 7. リソース回復
  if (features.recoveryNeed >= 65 && features.hasRecoveryInHand) {
    return {
      type: "recover",
      primaryReason: "トラッシュのリソースを整理し、長期戦に備えた粘りを作る必要があります。リソース管理が勝敗を分ける局面です。",
      requiredOutcome: ["recover_core_piece", "improve_followup", "resource_management"],
    };
  }

  // 8. デフォルト：安定化
  return {
    type: "stabilize",
    primaryReason: "大きな動きが難しい盤面ですが、手札を整えて次ターンの爆発力を高める、堅実な「安定化」を目指すべきターンです。",
    requiredOutcome: ["increase_consistency", "avoid_overextend", "retain_resources"],
  };
}

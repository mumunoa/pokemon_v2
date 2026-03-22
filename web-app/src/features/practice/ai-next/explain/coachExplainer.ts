import type { BoardState, ScoredAction } from "../domain/types";
import type { BoardUrgencyProfile } from "../engine/boardUrgency";

export type OpeningCoachContext = {
  handGrade?: string;
  openingSummary?: string;
};

export function explainWhyNow(best: ScoredAction | null, urgency: BoardUrgencyProfile): string {
  const needs: string[] = [];
  if (urgency.needSetupNow >= 60) needs.push("盤面形成");
  if (urgency.needDrawNow >= 60) needs.push("手札安定");
  if (urgency.needGustNow >= 60) needs.push("呼び出し圧力");
  if (urgency.needStallNow >= 60) needs.push("テンポ阻害");
  if (urgency.needRecoveryNow >= 60) needs.push("盤面復旧");
  if (urgency.needEnergyNow >= 60) needs.push("攻撃成立");

  if (!best) {
    return needs.length ? `現局面では ${needs.join(" / ")} が重要です。` : "現局面は安定行動優先です。";
  }

  const reason = needs.length ? `現局面では ${needs.join(" / ")} が重要です。` : "現局面は安定行動優先です。";
  return `${reason} そのため「${best.line}」を最優先にします。`;
}

function explainRejection(best: ScoredAction | null, alternatives: ScoredAction[]): string {
  if (!best || alternatives.length === 0) return "他候補との差はまだ小さく、局面理解が優先です。";
  const rejected = alternatives.slice(0, 2).map((alt) => `「${alt.line}」`).join("、");
  return `代替案としては ${rejected} が見えますが、今回は最終盤面の再現性で一段劣ります。`;
}

function explainRisk(best: ScoredAction | null): string {
  if (!best) return "リスクは小さくありません。安全な接続を優先してください。";
  if (best.tags.includes("draw")) {
    return "ドロー先行は強力ですが、現物札を流すリスクがあるため要求不足のときだけ選ぶべきです。";
  }
  if (best.tags.includes("bench_setup")) {
    return "展開優先は安定しますが、次ターンのエネルギー到達だけは別軸で確保が必要です。";
  }
  if (best.tags.includes("gust")) {
    return "呼び出し優先は通ると強い一方、返しのテンポ損が大きい点に注意が必要です。";
  }
  return "このラインは安定寄りですが、次ターンの要求札を1枚で満たせるかを常に確認してください。";
}

export function explainEndgameView(board: BoardState, urgency: BoardUrgencyProfile, best: ScoredAction | null): string {
  const playerRemaining = 6 - board.prizesTakenByPlayer;
  const opponentRemaining = 6 - board.prizesTakenByOpponent;
  const endgameTone =
    urgency.phase === "endgame"
      ? "終盤はサイドプランのズレがそのまま敗着になります。"
      : urgency.phase === "midgame"
        ? "中盤は次ターンの主導権を取る準備が重要です。"
        : "序盤は再現性を優先して主力ラインを確保するのが基本です。";

  const lineTone = best
    ? `現在は ${playerRemaining} - ${opponentRemaining} のサイドレースで、「${best.line}」が最も勝ち筋へ近いです。`
    : `現在は ${playerRemaining} - ${opponentRemaining} のサイドレースです。`;

  return `${endgameTone} ${lineTone}`;
}

export function buildCoachNarrative(
  board: BoardState,
  urgency: BoardUrgencyProfile,
  best: ScoredAction | null,
  alternatives: ScoredAction[],
  opening?: OpeningCoachContext,
): string {
  const openingText = opening?.openingSummary
    ? `初動評価は ${opening.handGrade ?? "B"} 相当です。${opening.openingSummary}`
    : "";

  const why = explainWhyNow(best, urgency);
  const compare = explainRejection(best, alternatives);
  const risk = explainRisk(best);
  const endgame = explainEndgameView(board, urgency, best);

  return [openingText, why, compare, risk, endgame].filter(Boolean).join(" ");
}

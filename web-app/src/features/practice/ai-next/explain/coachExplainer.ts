import type { BoardState, RecommendationResult, ScoredAction } from "../domain/types";
import type { BoardUrgencyProfile } from "../engine/boardUrgency";

export function explainWhyNow(best: ScoredAction | null, urgency: BoardUrgencyProfile): string {
  const needs: string[] = [];
  if (urgency.needSetupNow >= 60) needs.push("盤面形成");
  if (urgency.needDrawNow >= 60) needs.push("手札安定");
  if (urgency.needGustNow >= 60) needs.push("呼び出し圧力");
  if (urgency.needStallNow >= 60) needs.push("テンポ阻害");
  if (urgency.needRecoveryNow >= 60) needs.push("盤面復旧");

  if (!best) {
    return needs.length ? `現局面では ${needs.join(" / ")} が重要です。` : "現局面は安定行動優先です。";
  }

  const reason = needs.length ? `現局面では ${needs.join(" / ")} が重要です。` : "現局面は安定行動優先です。";
  return `${reason} そのため「${best.line}」を最優先にします。`;
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
): string {
  const why = explainWhyNow(best, urgency);
  const endgame = explainEndgameView(board, urgency, best);
  const alt =
    alternatives.length > 0
      ? `代替案としては ${alternatives.slice(0, 2).map((a) => `「${a.line}」`).join("、")} が有力です。`
      : "有力な代替案はまだ少ないです。";

  return [why, endgame, alt].join(" ");
}

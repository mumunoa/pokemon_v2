import type { BoardInsightBreakdown, BoardInsightReason } from '@/types/board-insight';

export function buildBoardScoreReason(meta: BoardInsightBreakdown): BoardInsightReason {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const nextActions: string[] = [];
  const freeHints: string[] = [];

  if (meta.openingScore >= 80) {
    strengths.push('初動の入りが安定している');
    freeHints.push('初動のつながりは良好です');
  }
  if (meta.consistencyScore >= 80) strengths.push('再現性が高く同じ動きを取りやすい');
  if (meta.tempoScore >= 80) strengths.push('現在の展開テンポが良い');
  if (meta.convertScore >= 80) strengths.push('勝ち筋へ接続しやすい');

  if (meta.riskScore >= 50) {
    weaknesses.push('裏目の受けが弱くリスクが高い');
    freeHints.push('裏目を引くと失速しやすいです');
  }
  if (meta.openingScore < 65) weaknesses.push('初動の安定性が不足している');
  if (meta.tempoScore < 65) weaknesses.push('盤面のテンポが遅れている');
  if (meta.convertScore < 65) weaknesses.push('勝ち筋への接続が弱い');

  if (meta.riskScore >= 50) nextActions.push('安全ルートを優先して手札消費を抑える');
  if (meta.tempoScore < 70) nextActions.push('盤面展開を優先してテンポを取り戻す');
  if (meta.convertScore < 70) nextActions.push('次ターンの勝ち筋につながる札を優先確保する');
  if (meta.tacticalScore >= 80) nextActions.push('最善手の再現性を意識して勝ち筋へ寄せる');

  const summary =
    meta.boardScore >= 80
      ? '現在の盤面は優勢寄りです。強みを維持しながら勝ち筋へ接続できます。'
      : meta.boardScore >= 70
        ? '現在の盤面は戦える状態ですが、改善余地があります。'
        : '現在の盤面は不安定です。安全な再建ルートを優先するのが有効です。';

  if (freeHints.length === 0) {
    freeHints.push(meta.boardScore >= 75 ? '結論としては戦える盤面です' : '結論としては慎重な立て直しが必要です');
  }

  return {
    summary,
    strengths,
    weaknesses,
    nextActions,
    freeHints,
  };
}

import type { BoardInsightMeta, BoardInsightShareSummary } from '@/types/board-insight';

export function buildBoardInsightShareSummary(input: {
  deckName: string;
  boardInsight: BoardInsightMeta;
  bestAction?: string | null;
}): BoardInsightShareSummary {
  return {
    deckName: input.deckName,
    boardScore: input.boardInsight.breakdown.boardScore,
    boardGrade: input.boardInsight.breakdown.boardGrade,
    openingScore: input.boardInsight.breakdown.openingScore,
    riskScore: input.boardInsight.breakdown.riskScore,
    summary: input.boardInsight.reason.summary,
    bestAction: input.bestAction ?? undefined,
    caution: input.boardInsight.reason.weaknesses[0],
  };
}

export function buildBoardInsightXText(input: {
  summary: BoardInsightShareSummary;
  shareUrl?: string;
  variant?: 'balanced' | 'strong' | 'warning' | 'question';
}) {
  const { summary, shareUrl } = input;
  const url = shareUrl ? ` ${shareUrl}` : '';
  const variant = input.variant ?? 'balanced';

  const candidates = {
    balanced: `${summary.deckName}の現在盤面は${summary.boardGrade}（${summary.boardScore}点）。初動${summary.openingScore}、この局面はまだ戦える。 #ポケカAI #ポケカ${url}`,
    strong: `${summary.deckName}の現在盤面、AI評価は${summary.boardGrade}/${summary.boardScore}点。勝ち筋へつながりやすい。 #ポケカAI${url}`,
    warning: `${summary.deckName}の現在盤面は${summary.boardGrade}（${summary.boardScore}点）。裏目警戒${summary.riskScore}、慎重に進めたい。 #ポケカ #ポケカAI${url}`,
    question: `この${summary.deckName}盤面、あなたならどう動く？AI評価は${summary.boardGrade}/${summary.boardScore}。 #ポケカAI${url}`,
  } as const;

  const text = candidates[variant].slice(0, 120);
  return {
    text,
    length: text.length,
    variant,
  };
}

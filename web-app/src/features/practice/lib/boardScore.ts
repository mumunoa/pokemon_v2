import type { BoardInsightBreakdown, BoardInsightGrade } from '@/types/board-insight';

type OpeningMetricsLike = {
  openingScore?: number | null;
  consistencyScore?: number | null;
  riskScore?: number | null;
};

type CoachResultLike = {
  bestAction?: string | null;
  alternatives?: Array<unknown> | null;
  thoughts?: Array<unknown> | null;
  confidenceScore?: number | null;
  openingMetrics?: OpeningMetricsLike | null;
};

export type BuildBoardScoreInput = {
  openingMetrics?: OpeningMetricsLike | null;
  coachResult?: CoachResultLike | null;
  tacticalConfidence?: number | null;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function boardScoreToGrade(score: number): BoardInsightGrade {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

function inferTempoScore(input: BuildBoardScoreInput) {
  const altCount = input.coachResult?.alternatives?.length ?? 0;
  const thoughtCount = input.coachResult?.thoughts?.length ?? 0;
  const base = 54 + Math.min(altCount, 3) * 7 + Math.min(thoughtCount, 3) * 4;
  return clamp(base);
}

function inferConvertScore(input: BuildBoardScoreInput) {
  const hasBestAction = Boolean(input.coachResult?.bestAction);
  const confidence = input.tacticalConfidence ?? input.coachResult?.confidenceScore ?? 68;
  return clamp((hasBestAction ? 60 : 48) + (confidence - 50) * 0.55);
}

function inferTacticalScore(input: BuildBoardScoreInput) {
  const confidence = input.tacticalConfidence ?? input.coachResult?.confidenceScore ?? 68;
  const alternativeBonus = Math.min(input.coachResult?.alternatives?.length ?? 0, 3) * 5;
  return clamp(confidence + alternativeBonus);
}

export function buildBoardScore(input: BuildBoardScoreInput): BoardInsightBreakdown {
  const openingScore = clamp(
    input.openingMetrics?.openingScore ??
      input.coachResult?.openingMetrics?.openingScore ??
      65,
  );

  const consistencyScore = clamp(
    input.openingMetrics?.consistencyScore ??
      input.coachResult?.openingMetrics?.consistencyScore ??
      65,
  );

  const riskScore = clamp(
    input.openingMetrics?.riskScore ??
      input.coachResult?.openingMetrics?.riskScore ??
      35,
  );

  const tempoScore = inferTempoScore(input);
  const convertScore = inferConvertScore(input);
  const tacticalScore = inferTacticalScore(input);

  const boardScore = clamp(
    openingScore * 0.20 +
      consistencyScore * 0.15 +
      tempoScore * 0.20 +
      convertScore * 0.20 +
      tacticalScore * 0.15 +
      (100 - riskScore) * 0.10,
  );

  return {
    openingScore,
    consistencyScore,
    tempoScore,
    convertScore,
    tacticalScore,
    riskScore,
    boardScore,
    boardGrade: boardScoreToGrade(boardScore),
  };
}

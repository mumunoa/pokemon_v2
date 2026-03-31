import type { ShareScoreSummary } from '@/types/monetization';

type BuildSummaryInput = {
  deckName?: string;
  aiAnalysis?: any;
  commentary?: any;
  coachResult?: any;
  fallbackSource?: ShareScoreSummary['source'];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pickNumber(...values: Array<unknown>): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function pickText(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function scoreToTier(score: number): ShareScoreSummary['overallTier'] {
  if (score >= 85) return 'S';
  if (score >= 72) return 'A';
  if (score >= 58) return 'B';
  return 'C';
}

export function buildShareSummary(input: BuildSummaryInput): ShareScoreSummary | null {
  const setupRate = clamp(
    pickNumber(
      input.aiAnalysis?.setupRate,
      input.coachResult?.openingMetrics?.setupRate,
      input.coachResult?.opening?.setupRate,
      input.commentary?.metrics?.setupRate,
      70,
    ) ?? 70,
    0,
    100,
  );

  const accidentRate = clamp(
    pickNumber(
      input.aiAnalysis?.accidentRate,
      input.coachResult?.openingMetrics?.accidentRate,
      input.coachResult?.opening?.accidentRate,
      input.commentary?.metrics?.accidentRate,
      Math.max(5, 100 - setupRate),
    ) ?? Math.max(5, 100 - setupRate),
    0,
    100,
  );

  const explicitScore = pickNumber(
    input.coachResult?.summary?.overallScore,
    input.coachResult?.overallScore,
    input.commentary?.overallScore,
  );
  const overallScore = clamp(
    explicitScore ?? Math.round(setupRate * 0.78 + (100 - accidentRate) * 0.22),
    0,
    100,
  );

  const bestAction = pickText(
    input.coachResult?.baseRecommendation?.bestAction?.title,
    input.coachResult?.bestAction?.title,
    input.commentary?.bestActions?.[0]?.title,
    input.aiAnalysis?.recommendedAction,
  );

  const caution = pickText(
    input.coachResult?.baseRecommendation?.bestAction?.cons?.[0],
    input.coachResult?.bestAction?.cons?.[0],
    input.commentary?.bestActions?.[0]?.cons?.[0],
    input.aiAnalysis?.description,
  );

  const environmentRankPercent = clamp(
    pickNumber(
      input.coachResult?.summary?.environmentRankPercent,
      input.coachResult?.environmentRankPercent,
      Math.max(3, Math.round(100 - overallScore)),
    ) ?? Math.max(3, Math.round(100 - overallScore)),
    1,
    99,
  );

  const deckName = pickText(input.deckName) ?? '現在の盤面';
  const source = input.coachResult ? 'pro_coach' : (input.fallbackSource ?? 'ai_analysis');

  return {
    deckName,
    overallTier: scoreToTier(overallScore),
    overallScore,
    setupRate,
    accidentRate,
    environmentRankPercent,
    bestAction,
    caution,
    source,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import type { BoardInsightMeta } from '@/types/board-insight';
import { buildBoardScore } from '@/features/practice/lib/boardScore';
import { buildBoardScoreReason } from '@/features/practice/lib/boardScoreReason';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      openingMetrics?: {
        openingScore?: number;
        consistencyScore?: number;
        riskScore?: number;
      };
      coachResult?: {
        bestAction?: string;
        alternatives?: Array<unknown>;
        thoughts?: Array<unknown>;
        confidenceScore?: number;
        openingMetrics?: {
          openingScore?: number;
          consistencyScore?: number;
          riskScore?: number;
        };
      };
      tacticalConfidence?: number;
    };

    const breakdown = buildBoardScore({
      openingMetrics: body.openingMetrics,
      coachResult: body.coachResult,
      tacticalConfidence: body.tacticalConfidence,
    });

    const result: BoardInsightMeta = {
      breakdown,
      reason: buildBoardScoreReason(breakdown),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/board-insight/summary] failed', error);
    return NextResponse.json({ error: 'Failed to summarize board insight' }, { status: 500 });
  }
}

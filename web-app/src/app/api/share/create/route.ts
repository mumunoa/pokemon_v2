import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { getAuthenticatedUserId } from '@/lib/server/routeAuth';
import type { ShareCreateRequest } from '@/types/monetization-backend';

type BoardInsightSummaryPayload = {
  boardScore?: number;
  boardGrade?: string;
  summary?: string;
  openingScore?: number;
  riskScore?: number;
};

function createSlug() {
  return randomBytes(4).toString('hex');
}

function normalizeSummary(summary: Record<string, unknown>) {
  const board = summary as BoardInsightSummaryPayload;
  return {
    ...summary,
    boardScore: typeof board.boardScore === 'number' ? board.boardScore : null,
    boardGrade: typeof board.boardGrade === 'string' ? board.boardGrade : null,
    summary: typeof board.summary === 'string' ? board.summary : null,
    openingScore: typeof board.openingScore === 'number' ? board.openingScore : null,
    riskScore: typeof board.riskScore === 'number' ? board.riskScore : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ShareCreateRequest;
    if (!body.deckName || !body.shareType || !body.templateId || !body.shareText || !body.summary) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const slug = createSlug();
    const normalizedSummary = normalizeSummary(body.summary);

    const { error: snapshotError } = await supabase.from('analysis_snapshots').insert({
      user_id: userId,
      slug,
      deck_name: body.deckName,
      summary_json: normalizedSummary,
    });
    if (snapshotError) throw snapshotError;

    const { error: eventError } = await supabase.from('share_events').insert({
      user_id: userId,
      share_type: body.shareType,
      slug,
      template_id: body.templateId,
      share_text: body.shareText,
      clicked_count: 0,
      signup_count: 0,
    });
    if (eventError) throw eventError;

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
    return NextResponse.json({ slug, shareUrl: `${origin}/share/${slug}` });
  } catch (error) {
    console.error('[POST /api/share/create] failed', error);
    return NextResponse.json({ error: 'Failed to create share snapshot' }, { status: 500 });
  }
}

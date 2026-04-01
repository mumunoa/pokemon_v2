import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: string };
    if (!body.slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error: selectError } = await supabase
      .from('share_events')
      .select('id,clicked_count')
      .eq('slug', body.slug)
      .maybeSingle();

    if (selectError) throw selectError;
    if (!row) return NextResponse.json({ ok: true, updated: false });

    const { error: updateError } = await supabase
      .from('share_events')
      .update({ clicked_count: (row.clicked_count ?? 0) + 1 })
      .eq('id', row.id);

    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, updated: true });
  } catch (error) {
    console.error('[POST /api/share/click] failed', error);
    return NextResponse.json({ error: 'Failed to track share click' }, { status: 500 });
  }
}

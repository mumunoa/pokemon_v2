import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/server/routeAuth';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

const DAILY_REWARD_LIMIT = 1;

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { slug?: string };
    if (!body.slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const { count, error: rewardCountError } = await supabase
      .from('feature_entitlements')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', userId)
      .eq('source_type', 'reward')
      .eq('source_ref', `share:${body.slug}`)
      .gte('created_at', start.toISOString());

    if (rewardCountError) throw rewardCountError;
    if ((count ?? 0) >= DAILY_REWARD_LIMIT) {
      return NextResponse.json({ ok: true, rewarded: false, reason: 'daily_limit' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('ai_tickets')
      .eq('id', userId)
      .single();
    if (profileError) throw profileError;

    const { error: updateError } = await supabase
      .from('users')
      .update({ ai_tickets: (profile.ai_tickets ?? 0) + 1 })
      .eq('id', userId);
    if (updateError) throw updateError;

    const { error: insertError } = await supabase.from('feature_entitlements').insert({
      user_id: userId,
      feature_code: 'analysis.daily.free',
      source_type: 'reward',
      source_ref: `share:${body.slug}`,
    });
    if (insertError) throw insertError;

    return NextResponse.json({ ok: true, rewarded: true, aiTicketsAdded: 1 });
  } catch (error) {
    console.error('[POST /api/share/reward] failed', error);
    return NextResponse.json({ error: 'Failed to apply share reward' }, { status: 500 });
  }
}

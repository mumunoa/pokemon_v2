import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { feedback, gameId, turnCount } = await req.json();

        if (!gameId) {
            return NextResponse.json({ error: 'gameId is required' }, { status: 400 });
        }

        const supabase = createSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase client not available' }, { status: 500 });
        }

        // 最も新しい分析ログに対してフィードバックを更新
        const { error } = await supabase
            .from('ai_analysis_logs')
            .update({ user_feedback: feedback })
            .eq('game_id', gameId)
            .eq('turn_count', turnCount)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Feedback Update Error:', error);
            return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Feedback API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

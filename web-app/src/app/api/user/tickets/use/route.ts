import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseClient } from '@/lib/supabase';
import { deductTicket } from '@/lib/ai/ticketHelper';

/**
 * 1チケットを消費してPro機能を一時的に解禁するAPI
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // 現在のチケット枚数を確認
        const { data: profile, error: fetchError } = await supabase
            .from('users')
            .select('ai_tickets')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (profile.ai_tickets <= 0) {
            return NextResponse.json({ error: 'TICKETS_EMPTY' }, { status: 403 });
        }

        // チケットを1枚消費
        await deductTicket(supabase, userId, profile.ai_tickets);

        return NextResponse.json({ success: true, remainingTickets: profile.ai_tickets - 1 });
    } catch (error: any) {
        console.error('Ticket Use API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

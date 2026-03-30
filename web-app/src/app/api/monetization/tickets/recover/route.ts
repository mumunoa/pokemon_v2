import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase';
import { recoverTicket } from '@/lib/ai/ticketHelper';

/**
 * リワード広告視聴完了後にチケットを1枚回復させるAPI
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = createAdminClient();
        if (!supabase) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // チケットを1枚回復 (特権権限で確実に更新)
        await recoverTicket(supabase, userId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Ticket Recovery API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

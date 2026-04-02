import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
    try {
        const { userId, getToken } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let supabaseToken: string | null = null;
        try {
            supabaseToken = await getToken({ template: 'supabase' });
        } catch (e) {
            console.warn('Clerk: Supabase JWT template not configured or error fetching token:', e);
        }

        const supabase = createSupabaseClient(supabaseToken || undefined);

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
        }

        const { error: resetError } = await (async () => {
            // ここでは管理権限(Service Role)でリセット判定を行うため、別クライアントを作成
            const { createAdminClient } = await import('@/lib/supabase');
            const { checkAndResetTickets } = await import('@/lib/ai/ticketHelper');
            const adminSupabase = createAdminClient();
            if (!adminSupabase) throw new Error('Admin client failed');
            
            await checkAndResetTickets(adminSupabase, userId);
            return { error: null };
        })().catch(e => ({ error: e }));

        if (resetError) {
            console.error('Ticket reset failed in profile API:', resetError);
        }

        // リセット処理（もしあれば）の後に、最新のレコードを全取得して返す
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            return NextResponse.json({
                id: userId,
                ai_tickets: 3,
                pro_trial_until: null,
            });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('User profile API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user profile', details: error?.message || String(error) },
            { status: 500 }
        );
    }
}

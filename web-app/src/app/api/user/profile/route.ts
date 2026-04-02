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

        const { data: adminProfile, error: resetError } = await (async () => {
            // ここでは管理権限(Service Role)でリセット判定を行うため、別クライアントを作成
            const { createAdminClient } = await import('@/lib/supabase');
            const { checkAndResetTickets } = await import('@/lib/ai/ticketHelper');
            const adminSupabase = createAdminClient();
            if (!adminSupabase) throw new Error('Admin client failed');
            
            const updated = await checkAndResetTickets(adminSupabase, userId);
            return { data: updated, error: null };
        })().catch(e => ({ data: null, error: e }));

        if (resetError) {
            console.error('Ticket reset failed in profile API:', resetError);
        }

        // 常に最新の状態（リセット後）を返す
        if (adminProfile) {
            return NextResponse.json(adminProfile);
        }

        // 万が一リセット処理が失敗した場合は、通常の取得を試みる
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

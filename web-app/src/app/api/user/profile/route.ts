import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createSupabaseClient } from '@/lib/supabase';

export async function GET() {
    try {
        const { userId, getToken } = await auth();
        const user = await currentUser();

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

        // プロフィール取得。もし存在しなければ新規作成。
        const { data: fetchedData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        let profileData = fetchedData;

        if (fetchError || !fetchedData) {
            // 新規作成 (Service Role で確実に作成)
            const { createAdminClient } = await import('@/lib/supabase');
            const adminSupabase = createAdminClient();
            if (adminSupabase) {
                const { data: newData, error: createError } = await adminSupabase
                    .from('users')
                    .upsert({
                        id: userId,
                        email: user?.primaryEmailAddress?.emailAddress || '',
                        plan_type: 'free',
                        ai_tickets: 3,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (!createError && newData) {
                    profileData = newData;
                }
            }
        }

        // 最新のプロフィールデータがある状態でリセット判定を行う
        if (profileData) {
            const { createAdminClient } = await import('@/lib/supabase');
            const { checkAndResetTickets } = await import('@/lib/ai/ticketHelper');
            const adminSupabase = createAdminClient();
            if (adminSupabase) {
                await checkAndResetTickets(adminSupabase, userId);
            }

            // リセット後の最終的なデータを再取得
            const { data: finalData } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (finalData) {
                profileData = finalData;
            }
        }

        if (!profileData) {
            return NextResponse.json({
                id: userId,
                ai_tickets: 3,
                pro_trial_until: null,
            });
        }

        return NextResponse.json(profileData);

    } catch (error: any) {
        console.error('User profile API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user profile', details: error?.message || String(error) },
            { status: 500 }
        );
    }
}

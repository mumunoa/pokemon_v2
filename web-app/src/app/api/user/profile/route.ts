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

        // ユーザー情報を取得
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);

            // Fetch error might be because row doesn't exist yet for some users
            // Optional: Auto-initialize here if webhook missed them, but for now just return default
            return NextResponse.json({
                id: userId,
                ai_tickets: 3,
                pro_trial_until: null,
                _note: 'Not found in DB, returning default'
            });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('User profile API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}

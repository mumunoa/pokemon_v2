import { SupabaseClient } from '@supabase/supabase-js';

/**
 * ユーザーのチケット枚数を確認し、必要であればデイリーリセット（毎日回復）を行います。
 * @param supabase Supabaseクライアント
 * @param userId ClerkのユーザーID
 * @returns 現在のチケット枚数とProプランかどうかの判定
 */
export async function checkAndResetTickets(supabase: SupabaseClient, userId: string): Promise<{ ai_tickets: number, isPro: boolean, plan_type: string }> {
    const { data: userProfile, error } = await supabase
        .from('users')
        .select('ai_tickets, last_ticket_reset_at, plan_type, pro_trial_until')
        .eq('id', userId)
        .single();

    if (error || !userProfile) {
        console.error('User profile not found in checkAndResetTickets:', error);
        throw new Error('User profile not found');
    }

    const now = new Date();
    const trialUntil = userProfile.pro_trial_until ? new Date(userProfile.pro_trial_until) : null;
    
    // キャンペーン期間中（環境変数で制御）または個別Proプランの場合
    const isEarlyAccessCampaign = process.env.NEXT_PUBLIC_CAMPAIGN_EARLY_ACCESS === 'true';
    const isPro = isEarlyAccessCampaign || 
                  userProfile.plan_type === 'pro' || 
                  userProfile.plan_type === 'elite' || 
                  (trialUntil !== null && trialUntil > now);
    
    const plan_type = userProfile.plan_type || 'free';

    if (isPro) {
        return { ai_tickets: 999, isPro: true, plan_type };
    }

    // デイリーリセット判定 (UTCベースで日付が変わっているか)
    const lastReset = userProfile.last_ticket_reset_at ? new Date(userProfile.last_ticket_reset_at) : new Date(0);
    const isDifferentDay = lastReset.getUTCFullYear() !== now.getUTCFullYear() ||
                          lastReset.getUTCMonth() !== now.getUTCMonth() ||
                          lastReset.getUTCDate() !== now.getUTCDate();

    if (isDifferentDay) {
        // 無料枠の回復（現在は1日3回）
        const dailyAllowance = 3;
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                ai_tickets: dailyAllowance,
                last_ticket_reset_at: now.toISOString(),
                updated_at: now.toISOString()
            })
            .eq('id', userId);
        
        if (updateError) {
            console.error('Failed to reset daily tickets:', updateError);
            // エラーでも現在の枚数で続行
            return { ai_tickets: userProfile.ai_tickets, isPro: false, plan_type };
        }
        return { ai_tickets: dailyAllowance, isPro: false, plan_type };
    }

    return { ai_tickets: userProfile.ai_tickets, isPro: false, plan_type };
}

/**
 * チケットを1枚消費します。
 */
export async function deductTicket(supabase: SupabaseClient, userId: string, currentTickets: number): Promise<void> {
    if (currentTickets <= 0) return;

    const { error } = await supabase
        .from('users')
        .update({ 
            ai_tickets: currentTickets - 1,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) {
        console.error('Error deducting ticket:', error);
    }
}

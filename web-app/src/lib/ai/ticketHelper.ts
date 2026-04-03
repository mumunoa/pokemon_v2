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
        console.error('[TicketReset] User profile not found:', error);
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
        console.log(`[TicketReset] User ${userId} is Pro (${plan_type}). Skipping daily reset.`);
        return { ai_tickets: 999, isPro: true, plan_type };
    }

    // デイリーリセット判定 (JST 0:00ベースで日付が変わっているか)
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);
    const lastResetStr = userProfile.last_ticket_reset_at;
    const lastReset = (lastResetStr && !isNaN(Date.parse(lastResetStr))) ? new Date(lastResetStr) : new Date(0);
    const jstLastReset = new Date(lastReset.getTime() + jstOffset);

    const isDifferentDay = jstLastReset.getUTCFullYear() !== jstNow.getUTCFullYear() ||
                          jstLastReset.getUTCMonth() !== jstNow.getUTCMonth() ||
                          jstLastReset.getUTCDate() !== jstNow.getUTCDate();

    console.log(`[TicketReset] Check for user ${userId}:`, {
        utcNow: now.toISOString(),
        jstNow: jstNow.toISOString(),
        lastResetInDB: lastResetStr,
        jstLastReset: jstLastReset.toISOString(),
        isDifferentDay,
        currentTickets: userProfile.ai_tickets
    });

    if (isDifferentDay) {
        const dailyAllowance = 3;
        console.log(`[TicketReset] Resetting tickets for user ${userId}: ${userProfile.ai_tickets} -> ${dailyAllowance}`);
        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                ai_tickets: dailyAllowance,
                last_ticket_reset_at: now.toISOString(),
                updated_at: now.toISOString()
            })
            .eq('id', userId);
        
        if (updateError) {
            console.error('[TicketReset] Failed to update DB:', updateError);
            return { ai_tickets: userProfile.ai_tickets || 0, isPro: false, plan_type };
        }
        return { ai_tickets: dailyAllowance, isPro: false, plan_type };
    }

    return { ai_tickets: userProfile.ai_tickets, isPro: false, plan_type };
}

/**
 * チケットを1枚消費します。
 */
export async function deductTicket(supabase: SupabaseClient, userId: string, currentTickets: number): Promise<void> {
    console.log(`[TicketDeduct] User ${userId}: Attempting to deduct from ${currentTickets}`);
    if (currentTickets <= 0) {
        console.warn(`[TicketDeduct] Aborted: tickets already 0 or less (${currentTickets})`);
        return;
    }

    const { error } = await supabase
        .from('users')
        .update({ 
            ai_tickets: currentTickets - 1,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (error) {
        console.error('[TicketDeduct] Database error:', error);
    } else {
        console.log(`[TicketDeduct] Successfully deducted. New approximate tickets: ${currentTickets - 1}`);
    }
}

/**
 * 動画視聴などでチケットを1枚回復（+1）させます。
 */
export async function recoverTicket(supabase: SupabaseClient, userId: string): Promise<void> {
    console.log(`[TicketRecover] User ${userId}: Fetching current tickets...`);
    const { data: userProfile, error: fetchError } = await supabase
        .from('users')
        .select('ai_tickets')
        .eq('id', userId)
        .single();

    if (fetchError || !userProfile) {
        console.error('[TicketRecover] Fetch error:', fetchError);
        return;
    }

    const newTickets = (userProfile.ai_tickets || 0) + 1;
    console.log(`[TicketRecover] Current: ${userProfile.ai_tickets}, Target recovery: ${newTickets}`);

    const { error: updateError } = await supabase
        .from('users')
        .update({ 
            ai_tickets: newTickets,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (updateError) {
        console.error('[TicketRecover] Update error:', updateError);
    } else {
        console.log(`[TicketRecover] Successfully added 1 ticket for user ${userId}. Total: ${newTickets}`);
    }
}

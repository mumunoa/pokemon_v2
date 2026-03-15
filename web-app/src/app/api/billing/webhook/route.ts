import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe 決済完了イベントを受け取り、ユーザーのプランを更新する Webhook (Skeleton)
 */
export async function POST(req: NextRequest) {
    const body = await req.text();
    // const sig = req.headers.get('stripe-signature');

    try {
        console.log('[Stripe Webhook Skeleton] Event received');

        // 本番環境では Stripe 署名検証を行う
        // const event = stripe.webhooks.constructEvent(body, sig!, endpointSecret!);

        /*
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;
            const userId = session.metadata.userId;
            const planType = session.metadata.planId; // 'pro' or 'elite'

            // 管理者権限（service_role）で Supabase クライアントを作成して更新
            const supabase = createSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
            await supabase
                .from('users')
                .update({ 
                    plan_type: planType,
                    stripe_customer_id: session.customer,
                    stripe_subscription_id: session.subscription,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
        }
        */

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('[Stripe Webhook Error]:', err.message);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }
}

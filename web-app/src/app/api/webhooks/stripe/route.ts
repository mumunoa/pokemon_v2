import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Stripe の初期化。キーがない場合は内部でエラーを投げないよう、使用時にチェックする。
const stripe = stripeSecret 
  ? new Stripe(stripeSecret, { apiVersion: '2025-01-27.acacia' as any })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error('Stripe configuration is missing (Secret Key or Webhook Secret)');
    return NextResponse.json({ error: 'Configuration missing' }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = session.metadata?.clerkUserId;
      const planId = session.metadata?.planId as 'pro' | 'elite' | 'free';

      if (clerkUserId && planId) {
        console.log(`[Webhook] Fulfilling purchase: ${clerkUserId}, Plan: ${planId}`);
        const adminSupabase = createAdminClient();
        if (adminSupabase) {
          await adminSupabase.from('users').update({
            plan_type: planId,
            updated_at: new Date().toISOString(),
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          }).eq('id', clerkUserId);
        }
      }
      break;
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;
      let clerkUserId = subscription.metadata?.clerkUserId;
      
      const adminSupabase = createAdminClient();
      if (!adminSupabase) break;

      // メタデータにない場合、顧客IDからユーザーを特定
      if (!clerkUserId) {
        const { data: user } = await adminSupabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();
        clerkUserId = user?.id;
      }

      if (!clerkUserId) {
        console.warn(`[Webhook] User not found for customer: ${stripeCustomerId}`);
        break;
      }

      // プラン判定ロジック
      let newPlanId: 'free' | 'pro' | 'elite' = 'free';
      const status = subscription.status;
      const isActive = status === 'active' || status === 'trialing';

      if (isActive) {
        const priceId = subscription.items.data[0]?.price.id;
        const { STRIPE_PRICE_TO_PLAN } = await import('@/lib/billing/plans');
        
        if (priceId && STRIPE_PRICE_TO_PLAN[priceId]) {
          newPlanId = STRIPE_PRICE_TO_PLAN[priceId] as 'pro' | 'elite';
        }
      }

      console.log(`[Webhook] Updating plan for ${clerkUserId}: ${newPlanId} (status: ${status})`);

      await adminSupabase
        .from('users')
        .update({ 
          plan_type: newPlanId, 
          updated_at: new Date().toISOString(),
          stripe_subscription_id: subscription.id
        })
        .eq('id', clerkUserId);
      
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

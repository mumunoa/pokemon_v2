import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as any })
  : null;

/**
 * Stripe Customer Portal セッションを作成します。
 * ユーザーが自身のサブスクリプションを管理（解約、アップグレード、ダウングレード）できるようにします。
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  try {
    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      throw new Error('Database connection failed');
    }

    // ユーザーの Stripe Customer ID を取得
    const { data: user, error: userError } = await adminSupabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.stripe_customer_id) {
      return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // カスタマーポータルセッションの作成
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

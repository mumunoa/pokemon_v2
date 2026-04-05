import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as any })
  : null;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { planId, addonId, priceId } = body;

  // Stripe が設定されていない場合はモックモード
  if (!stripe) {
    console.warn('STRIPE_SECRET_KEY is not set. Falling back to mock update.');
    return NextResponse.json({
      mode: 'mock_update',
      planId: planId || 'free',
      note: 'APIキー未設定のため擬似成功を返します。',
    });
  }

  try {
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Stripe 決済セッション作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Stripe 管理画面から取得した Price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        clerkUserId: userId,
        planId: planId || '',
        addonId: addonId || '',
      },
    });

    return NextResponse.json({
      mode: 'redirect',
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

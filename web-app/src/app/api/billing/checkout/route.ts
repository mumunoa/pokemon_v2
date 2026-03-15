import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * Stripe Checkout セッションを作成するAPI (Skeleton)
 * 実際の実装では Stripe SDK を使用します。
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { planId } = body;

        if (!planId) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

        console.log(`[Stripe Checkout Skeleton] Creating session for user ${userId} and plan ${planId}`);

        // TODO: Stripe SDK を使ってセッション作成
        /*
        const session = await stripe.checkout.sessions.create({
            customer_email: userEmail,
            line_items: [{ price: getPriceId(planId), quantity: 1 }],
            mode: 'subscription',
            success_url: `${origin}/billing?success=true`,
            cancel_url: `${origin}/billing?canceled=true`,
            metadata: { userId, planId },
        });
        return NextResponse.json({ url: session.url });
        */

        // モック応答
        return NextResponse.json({ 
            url: '/billing', 
            message: 'Stripe integration placeholder executed successfully.' 
        });
    } catch (err) {
        console.error('[Billing Checkout Error]:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

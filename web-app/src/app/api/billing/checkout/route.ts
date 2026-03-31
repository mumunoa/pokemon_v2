import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

  if (!body?.kind || (body.kind !== 'plan' && body.kind !== 'add_on')) {
    return NextResponse.json({ error: 'invalid kind' }, { status: 400 });
  }

  if (!stripeEnabled) {
    return NextResponse.json({
      mode: 'mock_update',
      kind: body.kind,
      planId: body.planId ?? null,
      addOnId: body.addOnId ?? null,
      note: 'STRIPE_SECRET_KEY 未設定のため mock update で動作',
    });
  }

  return NextResponse.json({
    mode: 'redirect',
    url: '/billing?mock_stripe=todo',
  });
}

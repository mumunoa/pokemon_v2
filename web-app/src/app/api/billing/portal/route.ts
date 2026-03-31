import { NextResponse } from 'next/server';

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ mode: 'unavailable', reason: 'stripe_not_configured' }, { status: 200 });
  }

  return NextResponse.json({ mode: 'redirect', url: '/billing?portal=todo' });
}

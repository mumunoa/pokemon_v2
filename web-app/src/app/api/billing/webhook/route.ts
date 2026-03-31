import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const payload = await request.text();
  return NextResponse.json({ received: true, bytes: payload.length, todo: 'stripe webhook event handling' });
}

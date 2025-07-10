import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
import { processBooking } from '@/app/(model)/(bookings)/payment.route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tickets, event_date_id } = body;

    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json({ success: false, message: 'No tickets selected' }, { status: 400 });
    }

    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json({ success: false, message: 'Missing token' }, { status: 401 });
    }

    const { success, payload } = await verifyRefreshToken(refreshToken);

    if (!success) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 403 });
    }

    if (payload.role !== 'procurer') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const user_id = payload.userId;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    const { sessionUrl } = await processBooking({
      user_id,
      tickets,
      event_date_id,
      baseUrl,
    });

    return NextResponse.json({ success: true, url: sessionUrl });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({
      success: false,
      message: 'Server error during checkout',
    }, { status: 500 });
  }
}

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
import { getBookings } from '@/app/(model)/(bookings)/getBookings.route';

export async function GET(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      const host = req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const url = `${protocol}://${host}/forbidden`
      return NextResponse.redirect(url);
    }

    const {success, message, payload } = await verifyRefreshToken(refreshToken);

    if (!success) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 403 });
    }

    if (payload.role != 'procurer') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const [bookings] = await getBookings(payload.userId);
    
    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('Fetch bookings error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

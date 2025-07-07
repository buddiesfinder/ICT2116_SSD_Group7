import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';

export async function GET(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const {success, message, payload } = await verifyRefreshToken(refreshToken);

    if (!success) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 403 });
    }
    const [bookings]: any = await db.execute(`
      SELECT 
        b.booking_id,
        b.quantity,
        b.amount_payable,
        b.booked_at,
        b.status,
        b.redeemed,
        e.title AS event_title,
        e.picture AS event_picture,
        ec.name AS seat_category,
        ed.event_date,
        ed.start_time,
        ed.end_time
      FROM Booking b
      JOIN Event e ON b.event_id = e.event_id
      JOIN SeatCategory ec ON b.seat_category_id = ec.seat_category_id
      JOIN EventDate ed ON b.event_date_id = ed.event_date_id
      WHERE b.user_id = ?
      ORDER BY b.booked_at DESC
    `, [payload.userId]);

    return NextResponse.json({ success: true, bookings });
  } catch (err) {
    console.error('Fetch bookings error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

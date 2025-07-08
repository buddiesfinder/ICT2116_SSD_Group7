import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';

export async function POST(req: NextRequest) {
  try {

    const refreshToken = req.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const {success, message, payload } = await verifyRefreshToken (refreshToken);
    
      if (!success) {
        return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 403 });
      }

    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    const [bookings]: any = await db.execute(
      `SELECT seat_category_id, quantity, event_date_id, user_id FROM Booking WHERE transaction_id = ?`,
      [transaction_id]
    );

    // Ensure all bookings belong to the authenticated user
    if (!bookings.every((b: any) => b.user_id === payload.user_id)) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    for (const booking of bookings) {

      await db.execute(
        `UPDATE AvailableSeats
         SET available_seats = available_seats + ?
         WHERE seat_category_id = ? AND event_date_id = ?`,
        [booking.quantity, booking.seat_category_id, booking.event_date_id]
      );
    
    }

    await db.execute(
      `UPDATE Transaction SET status = 'cancelled' WHERE transaction_id = ? AND status = 'unpaid'`,
      [transaction_id]
    );

    await db.execute(
      `UPDATE Booking SET status = 'cancelled' WHERE transaction_id = ? AND status = 'reserved'`,
      [transaction_id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel transaction error:', err);
    return NextResponse.json({ error: 'Failed to cancel transaction' }, { status: 500 });
  }
}

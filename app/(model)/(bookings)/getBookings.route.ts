
import { db } from '@/lib/db';

export async function getBookings(
  userId: any
) {

    const rows = await db.execute(`
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
    `, [userId]);

    return rows;
}


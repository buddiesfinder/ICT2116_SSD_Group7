import { db } from '@/lib/db';

export async function markExpiredAndRestoreSeats(transactionId: string) {
  await db.execute(
    `UPDATE Transaction SET status = 'expired' WHERE transaction_id = ? AND status = 'unpaid'`,
    [transactionId],
  );
  const [bookings]: any = await db.execute(
    `SELECT seat_category_id, quantity, event_date_id FROM Booking WHERE transaction_id = ?`,
    [transactionId],
  );
  for (const b of bookings)
    await db.execute(
      `UPDATE AvailableSeats
       SET available_seats = available_seats + ?
       WHERE seat_category_id = ? AND event_date_id = ?`,
      [b.quantity, b.seat_category_id, b.event_date_id],
    );
  await db.execute(
    `UPDATE Booking SET status = 'expired' WHERE transaction_id = ?`,
    [transactionId],
  );
}
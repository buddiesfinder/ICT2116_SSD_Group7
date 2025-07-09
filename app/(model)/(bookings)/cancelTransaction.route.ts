import { db } from '@/lib/db';

export async function cancelTransaction(bookings: any, transaction_id: any){

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
    
    return {success: true, message: "transcation cancelled."}
}
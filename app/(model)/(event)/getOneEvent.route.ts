import { db } from '@/lib/db';

export async function getOneEvent(event_id: string) {
  const [eventResult]: any = await db.execute('SELECT * FROM Event WHERE event_id = ?', [event_id]);
  const [seatCategoryResult]: any = await db.execute('SELECT * FROM SeatCategory WHERE event_id = ?', [event_id]);
  const [datesResult]: any = await db.execute(
    'SELECT event_date_id, event_date, start_time, end_time FROM EventDate WHERE event_id = ?',
    [event_id]
  );
  const [availableSeats]: any = await db.execute(
    `SELECT seat_category_id, event_date_id, available_seats
     FROM AvailableSeats
     WHERE event_date_id IN (
       SELECT event_date_id FROM EventDate WHERE event_id = ?
     )`,
    [event_id]
  );

  const event = eventResult[0];
  if (!event) {
    return { success: false, message: 'Event not found', status: 404 };
  }

  return {
    success: true,
    event,
    seatCategories: seatCategoryResult,
    dates: datesResult,
    availableSeats,
  };
}
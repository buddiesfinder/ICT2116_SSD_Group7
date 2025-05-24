import { db } from '@/lib/db';

export async function createEventHandler(event: {
  title: string;
  picture: string;
  description: string;
  location: string;
  price: number;
}) {
  try {
    const result = await db.query(
      `INSERT INTO SSD.Event (title, picture, description, location, created_at, price)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [event.title, event.picture, event.description, event.location, event.price]
    );

    console.log('Event inserted:', result);
    return { success: true, message: 'Event added successfully' };

  } catch (e) {
    console.error('Event insert error:', e);
    return { success: false, message: 'Failed to add event' };
  }
}

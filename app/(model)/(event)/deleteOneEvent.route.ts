import { db } from '@/lib/db';

export async function deleteOneEvent (event_id: any) {
    await db.execute('DELETE FROM EventDate WHERE event_id = ?', [event_id]);
    await db.execute('DELETE FROM Event WHERE event_id = ?', [event_id]);
}
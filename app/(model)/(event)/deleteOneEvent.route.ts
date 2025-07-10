import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function deleteOneEvent(event_id: any) {
  try {
    const [rows]: any = await db.execute(
      'SELECT picture FROM Event WHERE event_id = ?',
      [event_id]
    );

    if (rows.length > 0 && rows[0].picture) {
      const pictureName = rows[0].picture;
      const uploadDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, pictureName);

      // Delete the image file on server
      try {
        await fs.unlink(filePath);
        console.log(`Deleted image: ${filePath}`);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          console.warn(`Image not found: ${filePath}`);
        } else {
          console.error('Error deleting image:', err);
        }
      }
    }

    // Delete from Event from database
    await db.execute('DELETE FROM EventDate WHERE event_id = ?', [event_id]);
    await db.execute('DELETE FROM Event WHERE event_id = ?', [event_id]);

    console.log(`Deleted event and associated data for event_id: ${event_id}`);
  } catch (err) {
    console.error('Error deleting event:', err);
    throw err;
  }
}
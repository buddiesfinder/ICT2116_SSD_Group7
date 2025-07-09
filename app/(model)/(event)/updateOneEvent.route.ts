import { db } from '@/lib/db';
import path from 'path';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import SuccessPage from '@/app/(view)/success_payment/page';


export async function updateOneEvent(formData: any, event_id: any) {
 const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const categoriesRaw = formData.get('categories') as string;
    const categories = JSON.parse(categoriesRaw);
    const file = formData.get('picture') as File;
    const datesRaw = formData.get('dates') as string;
    const dates = JSON.parse(datesRaw); // array of { event_date, start_time, end_time }

    let imageUrl: string | null = null;

    if (file && typeof file !== 'string') {
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB file size allowed
      // Check image file size
      if (file.size > MAX_SIZE) {
        console.warn(`[UPLOAD] File size too large: ${file.size} bytes`);
        return {
            success: false, 
            message: 'File size too large',
            status: 400 
        }
      }

      // Validate image file type
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileType = await fileTypeFromBuffer(buffer);
      if (!fileType || !fileType.mime.startsWith('image/')) {
        console.warn('[UPLOAD] Rejected non-image file:', fileType);
        return { 
            success: false, 
            message: 'Invalid file type',
            status: 400 }
        
      }

      const allowTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowTypes.includes(fileType.mime)) {
        console.warn('[UPLOAD] Unsupported image format:', fileType.mime);
        return { 
            success: false, 
            message: 'Unsupported file format',
            status: 400 }
      }

      // Re-encode image to strip metadata
      const safeImageBuffer = await sharp(buffer).toBuffer();

      // Generate a unique filename with extension
      const filename = `${uuidv4()}-${fileType.ext}`;
      const filePath = path.join(process.cwd(), 'uploads', filename);
      await writeFile(filePath, safeImageBuffer);
      imageUrl = `/api/image/${filename}`;
    }

    if (imageUrl) {
      await db.execute(
        'UPDATE Event SET title = ?, picture = ?, description = ?, location = ? WHERE event_id = ?',
        [title, imageUrl, description, location, event_id]
      );
    } else {
      await db.execute(
        'UPDATE Event SET title = ?, description = ?, location = ? WHERE event_id = ?',
        [title, description, location, event_id]
      );
    }

    await db.execute('DELETE FROM SeatCategory WHERE event_id = ?', [event_id]);
    for (const category of categories) {
      await db.execute(
        'INSERT INTO SeatCategory (event_id, name, price) VALUES (?, ?, ?)',
        [event_id, category.name, category.price]
      );
    }

    await db.execute('DELETE FROM EventDate WHERE event_id = ?', [event_id]);
    for (const { event_date, start_time, end_time } of dates) {
      await db.execute(
        'INSERT INTO EventDate (event_id, event_date, start_time, end_time) VALUES (?, ?, ?, ?)',
        [event_id, event_date, start_time, end_time]
      );
    }

    const seatLimitMap: Record<string, number> = {
      Premium: 50,
      Standard: 100,
      Economy: 150
    };

    const [updatedSeatCategories]: any = await db.execute(
      'SELECT seat_category_id, name FROM SeatCategory WHERE event_id = ?',
      [event_id]
    );

    const [updatedEventDates]: any = await db.execute(
      'SELECT event_date_id FROM EventDate WHERE event_id = ?',
      [event_id]
    );

    await db.execute('DELETE FROM AvailableSeats WHERE seat_category_id IN (SELECT seat_category_id FROM SeatCategory WHERE event_id = ?)', [event_id]);

    for (const seatCategory of updatedSeatCategories) {
      const seatLimit = seatLimitMap[seatCategory.name] || 0;
      for (const eventDate of updatedEventDates) {
        await db.execute(
          'INSERT INTO AvailableSeats (seat_category_id, event_date_id, available_seats) VALUES (?, ?, ?)',
          [seatCategory.seat_category_id, eventDate.event_date_id, seatLimit]
        );
      }
    }

    return {
        success: true,
        message: "Event Updated Successfully."
    }
}
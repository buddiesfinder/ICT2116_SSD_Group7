import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
import { getOneEvent } from '@/app/(model)/(event)/getOneEvent.route';

type HandlerContext<T> = {
  params: Promise<T>;
};

// GET: /api/events/[event_id]
export async function GET(
  req: NextRequest,
  context: HandlerContext<{ event_id: string }>

) {
  const params = await context.params;
  const event_id = params.event_id;

  try {
    const oneEvent = await getOneEvent(event_id);

    if (!oneEvent.success) {
    return NextResponse.json({ success: false, message: oneEvent.message }, { status: oneEvent.status });
  }

  return NextResponse.json(oneEvent)
    // const [eventResult]: any = await db.execute('SELECT * FROM Event WHERE event_id = ?', [event_id]);
    // const [seatCategoryResult]: any = await db.execute('SELECT * FROM SeatCategory WHERE event_id = ?', [event_id]);
    // const [datesResult]: any = await db.execute(
    //   'SELECT event_date_id, event_date, start_time, end_time FROM EventDate WHERE event_id = ?',
    //   [event_id]
    // );

    // const [availableSeats]: any = await db.execute(
    //   `SELECT seat_category_id, event_date_id, available_seats
    //    FROM AvailableSeats
    //    WHERE event_date_id IN (
    //      SELECT event_date_id FROM EventDate WHERE event_id = ?
    //    )`,
    //   [event_id]
    // );

    // const event = eventResult[0];
    // if (!event) {
    //   return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    // }

    // return NextResponse.json({
    //   success: true,
    //   event,
    //   seatCategories: seatCategoryResult,
    //   dates: datesResult,
    //   availableSeats
    // });
  } catch (err) {
    console.error('Error fetching event detail:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT: /api/events/[event_id]
export async function PUT(
  req: NextRequest,
  context: HandlerContext<{ event_id: string }>
) {
  const params = await context.params;
  const event_id = params.event_id;

  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
  }

  const {success, message, payload } = await verifyRefreshToken(refreshToken);
  
  if (!success) {
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }

  if (payload.role !== 'admin' && payload.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
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
        return NextResponse.json(
          { success: false, message: 'File size too large'},
          { status: 400 }
        )
      }

      // Validate image file type
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileType = await fileTypeFromBuffer(buffer);
      if (!fileType || !fileType.mime.startsWith('image/')) {
        console.warn('[UPLOAD] Rejected non-image file:', fileType);
        return NextResponse.json(
          { success: false, message: 'Invalid file type'},
          { status: 400 }
        )
      }

      const allowTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowTypes.includes(fileType.mime)) {
        console.warn('[UPLOAD] Unsupported image format:', fileType.mime);
        return NextResponse.json(
          { success: false, message: 'Unsupported file format'},
          { status: 400 }
        )
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating event:', err);
    return NextResponse.json({ success: false, message: 'Server error updating event' }, { status: 500 });
  }
}

// DELETE: /api/events/[event_id]
export async function DELETE(
 req: NextRequest,
context: HandlerContext<{ event_id: string }>
) {
  const params = await context.params;
  const event_id = params.event_id;
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
  }

  const {success, message, payload } = await verifyRefreshToken(refreshToken);
  
  if (!success) {
    return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
  }

  if (payload.role !== 'admin' && payload.role !== 'owner') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }
  
  try {
    await db.execute('DELETE FROM EventDate WHERE event_id = ?', [event_id]);
    await db.execute('DELETE FROM Event WHERE event_id = ?', [event_id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    return NextResponse.json({ success: false, message: 'Server error deleting event' }, { status: 500 });
  }
}

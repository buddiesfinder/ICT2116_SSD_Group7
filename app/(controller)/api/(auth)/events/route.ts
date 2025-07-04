//backend to fetch all events and insert new event

import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle multipart/form-data
  },
};

export async function POST(req: NextRequest) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req.body, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    const title = fields.title as string;
    const description = fields.description as string;
    const location = fields.location as string;

    const datesRaw = fields.dates as string;
    const dates = JSON.parse(datesRaw); // expects [{ event_date: '2025-05-30', start_time: '18:00', end_time: '21:00' }, ...]

    const categoriesRaw = fields.categories as string;
    const categories = JSON.parse(categoriesRaw); // [{ category_id: 1, name: 'Premium', price: '300' }, ...]

    const seatLimitMap: Record<string, number> = { Premium: 50, Standard: 100, Economy: 150 };


    const file = files.picture;
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Invalid image' });
    }

    // Check for duplicate event title
    const [existing]: any = await db.execute(
      'SELECT event_id FROM Event WHERE title = ?',
      [title]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Event title already exists' },
        { status: 400 }
      );
    }

    // Read file from temporary location and write to uploads directory
    const fileBuffer = await fs.readFile(file.filepath);
    const filename = `${uuidv4()}-${file.originalFilename}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const filePath = path.join(uploadDir, filename);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, fileBuffer);

    const imageUrl = `/uploads/${filename}`;

    // Insert into Event table
    const [eventInsertResult]: any = await db.execute(
      'INSERT INTO Event (title, picture, description, location, created_at) VALUES (?, ?, ?, ?, NOW())',
      [title, imageUrl, description, location]
    );

    const eventId = eventInsertResult.insertId;

    // Insert pricing for each category in SeatCategory table
    for (const category of categories) {
      const seatLimit = seatLimitMap[category.name] || 0; // fallback to 0 if unknown
      await db.execute(
        'INSERT INTO SeatCategory (event_id, name, price, seat_limit) VALUES (?, ?, ?, ?)',
        [eventId, category.name, category.price, seatLimit]
      );
    }      

    // Insert each date into EventDate table
    for (const { event_date, start_time, end_time } of dates) {
      await db.execute(
        'INSERT INTO EventDate (event_id, event_date, start_time, end_time) VALUES (?, ?, ?, ?)',
        [eventId, event_date, start_time, end_time]
      );
    }

    // Insert the available seats 
    const [seatCategories] = await db.execute(
      'SELECT seat_category_id, seat_limit FROM SeatCategory WHERE event_id = ?', [eventId]
    ) as [Array<{ seat_category_id: number; seat_limit: number }>, any];
    const [eventDates] = await db.execute(
      'SELECT event_date_id FROM EventDate WHERE event_id = ?', [eventId]
    )as [Array<{ event_date_id: number }>, any];

    for (const category of seatCategories) {
      for (const date of eventDates) {
        await db.execute(
          'INSERT INTO AvailableSeats (seat_category_id, event_date_id, available_seats) VALUES (?, ?, ?)',
          [category.seat_category_id, date.event_date_id, category.seat_limit]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Event insert error:', err);
    return NextResponse.json({ success: false, message: 'Server error inserting event' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [rows] = await db.execute(`
      SELECT 
        e.event_id,
        e.title,
        e.picture,
        e.description,
        e.location,
        e.created_at,
        MIN(sc.price) AS lowest_price
      FROM Event e
      LEFT JOIN SeatCategory sc ON sc.event_id = e.event_id
      GROUP BY 
        e.event_id,
        e.title,
        e.picture,
        e.description,
        e.location,
        e.created_at
      ORDER BY e.created_at DESC;
      `);
    return NextResponse.json({ success: true, events: rows });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to fetch events' }, { status: 500 });
  }
}

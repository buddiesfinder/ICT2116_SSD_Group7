//backend to fetch all events and insert new event

import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const file = formData.get('picture') as File;

    // Get event_dates as a JSON string then parse
    const datesRaw = formData.get('dates') as string;
    const dates = JSON.parse(datesRaw); // expects [{ event_date: '2025-05-30', start_time: '18:00', end_time: '21:00' }, ...]

    const categoriesRaw = formData.get('categories') as string;
    const categories = JSON.parse(categoriesRaw); // [{ category_id: 1, name: 'Premium', price: '300' }, ...]

    const seatLimitMap: Record<string, number> = {Premium: 50, Standard: 100, Economy: 150};

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Invalid image' });
    }

    //Check for duplicate event title
    const [existing]: any = await db.query(
      'SELECT event_id FROM SSD.Event WHERE title = ?',
      [title]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Event title already exists' },
        { status: 400 }
      );
    }

    // Save image to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${uuidv4()}-${file.name}`;
    const filePath = path.join(process.cwd(), 'public/uploads', filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;

    // Insert into Event table
    const [eventInsertResult]: any = await db.query(
      'INSERT INTO SSD.Event (title, picture, description, location, created_at) VALUES (?, ?, ?, ?, NOW())',
      [title, imageUrl, description, location]
    );

    const eventId = eventInsertResult.insertId;

    // Insert pricing for each category in SeatCategory table
    for (const category of categories) {
      const seatLimit = seatLimitMap[category.name] || 0; // fallback to 0 if unknown
      await db.query(
        'INSERT INTO SSD.SeatCategory (event_id, name, price, seat_limit) VALUES (?, ?, ?, ?)',
        [eventId, category.name, category.price, seatLimit]
      );
    }      

    // Insert each date into EventDate table
    for (const { event_date, start_time, end_time } of dates) {
      await db.query(
        'INSERT INTO SSD.EventDate (event_id, event_date, start_time, end_time) VALUES (?, ?, ?, ?)',
        [eventId, event_date, start_time, end_time]
      );
    }

    // Insert the available seats 
    const [seatCategories] = await db.query(
      'SELECT seat_category_id, seat_limit FROM SSD.SeatCategory WHERE event_id = ?', [eventId]
    ) as [Array<{ seat_category_id: number; seat_limit: number }>, any];
    const [eventDates] = await db.query(
      'SELECT event_date_id FROM SSD.EventDate WHERE event_id = ?', [eventId]
    )as [Array<{ event_date_id: number }>, any];

    for (const category of seatCategories) {
      for (const date of eventDates) {
        await db.query(
          'INSERT INTO SSD.AvailableSeats (seat_category_id, event_date_id, available_seats) VALUES (?, ?, ?)',
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
    const [rows] = await db.query(`
      SELECT 
        e.*, 
        MIN(sc.price) AS lowest_price
      FROM SSD.Event e
      LEFT JOIN SSD.SeatCategory sc ON sc.event_id = e.event_id
      GROUP BY e.event_id
      ORDER BY e.created_at DESC
      `);
    return NextResponse.json({ success: true, events: rows });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to fetch events' }, { status: 500 });
  }
}

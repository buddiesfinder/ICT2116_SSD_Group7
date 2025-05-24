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
    const price = parseFloat(formData.get('price') as string);
    const file = formData.get('picture') as File;

    // Get event_dates as a JSON string then parse
    const datesRaw = formData.get('dates') as string;
    const dates = JSON.parse(datesRaw); // expects [{ event_date: '2025-05-30', start_time: '18:00', end_time: '21:00' }, ...]

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
      'INSERT INTO SSD.Event (title, picture, description, location, created_at, price) VALUES (?, ?, ?, ?, NOW(), ?)',
      [title, imageUrl, description, location, price]
    );

    const eventId = eventInsertResult.insertId;

    // Insert each date into EventDate table
    for (const { event_date, start_time, end_time } of dates) {
      await db.query(
        'INSERT INTO SSD.EventDate (event_id, event_date, start_time, end_time) VALUES (?, ?, ?, ?)',
        [eventId, event_date, start_time, end_time]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Event insert error:', err);
    return NextResponse.json({ success: false, message: 'Server error inserting event' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const [rows] = await db.query('SELECT * FROM SSD.Event ORDER BY created_at DESC');
    return NextResponse.json({ success: true, events: rows });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Failed to fetch events' }, { status: 500 });
  }
}

// import { db } from '@/lib/db';
// import { NextRequest, NextResponse } from 'next/server';
// import path from 'path';
// import { writeFile } from 'fs/promises';
// import { v4 as uuidv4 } from 'uuid';



// // GET: /api/events/[event_id]
// export async function GET(_: NextRequest, { params }: { params: { event_id: string } }) {
//   const eventId = params.event_id;
//   try {
//     const [eventResult]: any = await db.query('SELECT * FROM SSD.Event WHERE event_id = ?', [eventId]);
//     const [seatCategoryResult]: any = await db.query('SELECT * FROM SSD.SeatCategory WHERE event_id = ?', [eventId]);
//     const [datesResult]: any = await db.query('SELECT event_date_id, event_date, start_time, end_time FROM SSD.EventDate WHERE event_id = ?', [eventId]);

//     const [availableSeats]: any = await db.query(
//       `SELECT seat_category_id, event_date_id, available_seats
//       FROM SSD.AvailableSeats
//       WHERE event_date_id IN (
//         SELECT event_date_id FROM SSD.EventDate WHERE event_id = ?
//       )`,
//       [eventId]
//     );

//     const event = eventResult[0];
//     if (!event) {
//       return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
//     }
//     return NextResponse.json({ success: true, event, seatCategories: seatCategoryResult, dates: datesResult, availableSeats });
//   } catch (err) {
//     console.error('Error fetching event detail:', err);
//     return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
//   }
// }

// // PUT: /api/events/[event_id]
// export async function PUT(req: NextRequest, { params }: { params: { event_id: string } }) {
//   const eventId = params.event_id;

//   try {
//     const formData = await req.formData();
//     const title = formData.get('title') as string;
//     const description = formData.get('description') as string;
//     const location = formData.get('location') as string;
//     const categoriesRaw = formData.get('categories') as string;
//     const categories = JSON.parse(categoriesRaw);
//     const file = formData.get('picture') as File;
//     const datesRaw = formData.get('dates') as string;
//     const dates = JSON.parse(datesRaw); // array of { event_date, start_time, end_time }

//     let imageUrl: string | null = null;

//     // Handle new file upload
//     if (file && typeof file !== 'string') {
//       const bytes = await file.arrayBuffer();
//       const buffer = Buffer.from(bytes);
//       const filename = `${uuidv4()}-${file.name}`;
//       const filePath = path.join(process.cwd(), 'public/uploads', filename);
//       await writeFile(filePath, buffer);
//       imageUrl = `/uploads/${filename}`;
//     }

//     // Update event details
//     if (imageUrl) {
//       await db.query(
//         'UPDATE SSD.Event SET title = ?, picture = ?, description = ?, location = ? WHERE event_id = ?',
//         [title, imageUrl, description, location, eventId]
//       );
//     } else {
//       await db.query(
//         'UPDATE SSD.Event SET title = ?, description = ?, location = ? WHERE event_id = ?',
//         [title, description, location, eventId]
//       );
//     }

//     // Update seat category pricing
//     await db.query('DELETE FROM SSD.SeatCategory WHERE event_id = ?', [eventId]);
//     for (const category of categories) {
//       await db.query(
//         'INSERT INTO SSD.SeatCategory (event_id, name, price) VALUES (?, ?, ?)',
//         [eventId, category.name, category.price]
//       );
//     }

//     // Update event dates
//     await db.query('DELETE FROM SSD.EventDate WHERE event_id = ?', [eventId]);
//     for (const { event_date, start_time, end_time } of dates) {
//       await db.query(
//         'INSERT INTO SSD.EventDate (event_id, event_date, start_time, end_time) VALUES (?, ?, ?, ?)',
//         [eventId, event_date, start_time, end_time]
//       );
//     }

//     // Re-insert AvailableSeats for updated seat categories and dates
//     const seatLimitMap: Record<string, number> = {
//       Premium: 50,
//       Standard: 100,
//       Economy: 150
//     };

//     const [updatedSeatCategories]: any = await db.query(
//       'SELECT seat_category_id, name FROM SSD.SeatCategory WHERE event_id = ?',
//       [eventId]
//     );

//     const [updatedEventDates]: any = await db.query(
//       'SELECT event_date_id FROM SSD.EventDate WHERE event_id = ?',
//       [eventId]
//     );

//     // Clear old available seats
//     await db.query('DELETE FROM SSD.AvailableSeats WHERE seat_category_id IN (SELECT seat_category_id FROM SSD.SeatCategory WHERE event_id = ?)', [eventId]);

//     // Reinsert available seats
//     for (const seatCategory of updatedSeatCategories) {
//       const seatLimit = seatLimitMap[seatCategory.name] || 0;
//       for (const eventDate of updatedEventDates) {
//         await db.query(
//           'INSERT INTO SSD.AvailableSeats (seat_category_id, event_date_id, available_seats) VALUES (?, ?, ?)',
//           [seatCategory.seat_category_id, eventDate.event_date_id, seatLimit]
//         );
//       }
//     }

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error('Error updating event:', err);
//     return NextResponse.json({ success: false, message: 'Server error updating event' }, { status: 500 });
//   }
// }

// // DELETE: /api/events/[event_id]
// export async function DELETE(_: NextRequest, { params }: { params: { event_id: string } }) {
//   const eventId = params.event_id;
//   try {
//     await db.query('DELETE FROM SSD.EventDate WHERE event_id = ?', [eventId]);
//     await db.query('DELETE FROM SSD.Event WHERE event_id = ?', [eventId]);
//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error('Error deleting event:', err);
//     return NextResponse.json({ success: false, message: 'Server error deleting event' }, { status: 500 });
//   }
// }

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

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
    const [eventResult]: any = await db.query('SELECT * FROM SSD.Event WHERE event_id = ?', [event_id]);
    const [seatCategoryResult]: any = await db.query('SELECT * FROM SSD.SeatCategory WHERE event_id = ?', [event_id]);
    const [datesResult]: any = await db.query(
      'SELECT event_date_id, event_date, start_time, end_time FROM SSD.EventDate WHERE event_id = ?',
      [event_id]
    );

    const [availableSeats]: any = await db.query(
      `SELECT seat_category_id, event_date_id, available_seats
       FROM SSD.AvailableSeats
       WHERE event_date_id IN (
         SELECT event_date_id FROM SSD.EventDate WHERE event_id = ?
       )`,
      [event_id]
    );

    const event = eventResult[0];
    if (!event) {
      return NextResponse.json({ success: false, message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      event,
      seatCategories: seatCategoryResult,
      dates: datesResult,
      availableSeats
    });
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
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${uuidv4()}-${file.name}`;
      const filePath = path.join(process.cwd(), 'public/uploads', filename);
      await writeFile(filePath, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    if (imageUrl) {
      await db.query(
        'UPDATE SSD.Event SET title = ?, picture = ?, description = ?, location = ? WHERE event_id = ?',
        [title, imageUrl, description, location, event_id]
      );
    } else {
      await db.query(
        'UPDATE SSD.Event SET title = ?, description = ?, location = ? WHERE event_id = ?',
        [title, description, location, event_id]
      );
    }

    await db.query('DELETE FROM SSD.SeatCategory WHERE event_id = ?', [event_id]);
    for (const category of categories) {
      await db.query(
        'INSERT INTO SSD.SeatCategory (event_id, name, price) VALUES (?, ?, ?)',
        [event_id, category.name, category.price]
      );
    }

    await db.query('DELETE FROM SSD.EventDate WHERE event_id = ?', [event_id]);
    for (const { event_date, start_time, end_time } of dates) {
      await db.query(
        'INSERT INTO SSD.EventDate (event_id, event_date, start_time, end_time) VALUES (?, ?, ?, ?)',
        [event_id, event_date, start_time, end_time]
      );
    }

    const seatLimitMap: Record<string, number> = {
      Premium: 50,
      Standard: 100,
      Economy: 150
    };

    const [updatedSeatCategories]: any = await db.query(
      'SELECT seat_category_id, name FROM SSD.SeatCategory WHERE event_id = ?',
      [event_id]
    );

    const [updatedEventDates]: any = await db.query(
      'SELECT event_date_id FROM SSD.EventDate WHERE event_id = ?',
      [event_id]
    );

    await db.query('DELETE FROM SSD.AvailableSeats WHERE seat_category_id IN (SELECT seat_category_id FROM SSD.SeatCategory WHERE event_id = ?)', [event_id]);

    for (const seatCategory of updatedSeatCategories) {
      const seatLimit = seatLimitMap[seatCategory.name] || 0;
      for (const eventDate of updatedEventDates) {
        await db.query(
          'INSERT INTO SSD.AvailableSeats (seat_category_id, event_date_id, available_seats) VALUES (?, ?, ?)',
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
  try {
    await db.query('DELETE FROM SSD.EventDate WHERE event_id = ?', [event_id]);
    await db.query('DELETE FROM SSD.Event WHERE event_id = ?', [event_id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    return NextResponse.json({ success: false, message: 'Server error deleting event' }, { status: 500 });
  }
}

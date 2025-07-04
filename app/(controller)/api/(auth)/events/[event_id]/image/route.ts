import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } } // ✅ match your folder name!
) {
  try {
    const eventId = params.event_id;

    const [rows]: any = await db.execute(
      'SELECT picture FROM Event WHERE event_id = ?',
      [eventId]
    );

    if (!rows.length || !rows[0].picture) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const imageBuffer: Buffer = rows[0].picture;

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg', // update if needed
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('Image fetch error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

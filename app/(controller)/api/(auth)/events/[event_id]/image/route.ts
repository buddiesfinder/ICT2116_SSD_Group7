import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    // Fetch image BLOB from DB
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
        'Content-Type': 'image/jpeg', // Adjust if needed
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Image fetch error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

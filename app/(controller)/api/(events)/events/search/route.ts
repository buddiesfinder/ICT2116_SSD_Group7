import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query')?.trim();

  if (!query) {
    return NextResponse.json({ success: true, events: [] });
  }

  try {
    const [rows] = await db.execute(
      `
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
      WHERE e.title LIKE ? OR e.location LIKE ?
      GROUP BY 
        e.event_id,
        e.title,
        e.picture,
        e.description,
        e.location,
        e.created_at
      ORDER BY e.created_at DESC
      LIMIT 10
      `,
      [`%${query}%`, `%${query}%`]
    );

    return NextResponse.json({ success: true, events: rows });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ success: false, message: 'Search failed' }, { status: 500 });
  }
}

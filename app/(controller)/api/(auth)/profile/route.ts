import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decodeJwt } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('refresh_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = decodeJwt(token);
    const userId = payload.userId;

    const [rows] = await db.query('SELECT name FROM SSD.User WHERE user_id = ?', [userId]) as [any[], any];
    if (rows.length === 0) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, name: rows[0].name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, message: 'Error fetching profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('refresh_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { payload } = decodeJwt(token);
    const userId = payload.userId;

    const body = await req.json();
    const { name } = body;

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, message: 'Name is too short' }, { status: 400 });
    }

    await db.query('UPDATE SSD.User SET name = ? WHERE user_id = ?', [name, userId]);
    return NextResponse.json({ success: true, message: 'Name updated successfully' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, message: 'Failed to update name' }, { status: 500 });
  }
}

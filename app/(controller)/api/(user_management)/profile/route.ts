import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decodeJwt } from '@/lib/jwt';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('refresh_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { success, message, payload } = await verifyRefreshToken(token);

    if (!success) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const userId = payload.userId;

    const body = await req.json();
    const { name } = body;

    if (!name || name.length < 2) {
      return NextResponse.json({ success: false, message: 'Name is too short' }, { status: 400 });
    }

    await db.execute('UPDATE User SET name = ? WHERE user_id = ?', [name, userId]);
    return NextResponse.json({ success: true, message: 'Name updated successfully' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, message: 'Failed to update name' }, { status: 500 });
  }
}

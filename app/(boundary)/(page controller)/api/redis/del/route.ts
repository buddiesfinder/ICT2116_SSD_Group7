import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function POST(req: NextRequest) {
  const { key } = await req.json();

  if (!key) {
    return NextResponse.json({ message: 'Key is required' }, { status: 400 });
  }

  const deleted = await redis.del(key);
  if (deleted === 0) {
    return NextResponse.json({ message: 'Key not found or already deleted' }, { status: 404 });
  }

  return NextResponse.json({ message: `Deleted key '${key}'` });
}

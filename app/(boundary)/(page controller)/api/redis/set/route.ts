import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ message: 'Key and value are required' }, { status: 400 });
  }

  await redis.set(key, value);
  return NextResponse.json({ message: `Stored '${key}' in Redis` });
}

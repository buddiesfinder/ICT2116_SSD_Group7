import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function GET(req: NextRequest) {
    const key = req.nextUrl.searchParams.get('key');
  
    if (!key) {
      return NextResponse.json({ message: 'Key is required' }, { status: 400 });
    }
  
    const value = await redis.get(key);
    if (value === null) {
      return NextResponse.json({ message: 'Key not found' }, { status: 404 });
    }
  
    return NextResponse.json({ key, value });
  }
// anything in api folder is treated as an API route
// and will be served at /api/login
//backend code
import { NextRequest, NextResponse } from 'next/server';
import { registerHandler } from '@/app/(control)/registerHandler.route';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
  }

  // Called from control class
  const result = await registerHandler(email, password);

  return NextResponse.json({ success: result.success, message: result.message });
}

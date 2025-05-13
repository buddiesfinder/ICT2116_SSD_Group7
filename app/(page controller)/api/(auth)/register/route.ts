// anything in api folder is treated as an API route
// and will be served at /api/login
//backend code
import { NextRequest, NextResponse } from 'next/server';
import { addUser } from '@/lib/fakeUserStore';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
  }

  const success = addUser({ email, password });
  console.log('User registered:', email);

  if (!success) {
    return NextResponse.json({ success: false, message: 'User already exists' }, { status: 409 });
  }

  return NextResponse.json({ success: true, message: 'User registered successfully' });
}

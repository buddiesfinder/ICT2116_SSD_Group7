// anything in api folder is treated as an API route
// and will be served at /api/login
//backend code
import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/fakeUserStore';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
  }
  console.log('Trying to login with:', email, password); 

  const isValid = validateUser(email, password);

  if (!isValid) {
    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({ success: true, message: 'Login successful' });
}

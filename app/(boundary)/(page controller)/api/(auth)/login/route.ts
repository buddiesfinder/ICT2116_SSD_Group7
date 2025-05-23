// anything in api folder is treated as an API route
// and will be served at /api/login
//backend code
import { NextRequest, NextResponse } from 'next/server';
import { loginHandler } from '@/app/(control)/loginHandler.route';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Call the login handler
    const result = await loginHandler(email, password);
    console.log("result: ", result);

    // Return appropriate response based on login result
    return NextResponse.json(result, {
      status: result.success ? 200 : 401,
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
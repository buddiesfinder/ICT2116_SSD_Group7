// anything in api folder is treated as an API route
// and will be served at /api/login
//backend code
import { NextRequest, NextResponse } from 'next/server';
import { loginHandler } from '@/app/(model)/(auth)/loginHandler.route';

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

    // return result in http response format (with status code)
    const response = NextResponse.json( {
      success: result.success, 
      status: result.success ? 200 : 401,
      message: result.message
    });

    // Set token of log in.
      if (result.success && result.token) {
        response.cookies.set('refresh_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // maximum time it can live on the browser in seconds (30 days)
        path: '/',
      });
    }
    return response;

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
// anything in api folder is treated as an API route
// and will be served at /api/login
//backend code
import { NextRequest, NextResponse } from 'next/server';
import { FirstLoginFactor } from '@/app/(model)/(auth)/(login)/1FALogin.route';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { email, password, recaptchaToken } = body;

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
    const result = await FirstLoginFactor(email, password, recaptchaToken);

    // return result in http response format (with status code)
    const response = NextResponse.json({
    success: result.success,
    message: result.message,
    userId: result.userId,
    requireRecaptcha: result.requireRecaptcha ?? false,
  }, { status: result.success ? 200 : 401 });


    return response;

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
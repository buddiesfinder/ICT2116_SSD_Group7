import { NextRequest, NextResponse } from 'next/server';
import { emailChecker } from '@/app/(model)/(auth)/(forgot_password)/emailChecker.route';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { email } = body;

    // Basic validation
    if (!email) {
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
    const result = await emailChecker(email);

    const response = NextResponse.json({
    success: result.success,
    message: result.message,
    userId: result.userId
    });

    return response;

  } catch (error) {
    console.error('Forget-password API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
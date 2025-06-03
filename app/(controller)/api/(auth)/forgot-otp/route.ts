import { NextRequest, NextResponse } from 'next/server';
import { otpChecker } from '@/app/(model)/(auth)/(forgot_password)/otpChecker.route';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { email, otp } = body;

    const result = await otpChecker(email, otp);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, 
          message: result.message 
        },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
    success: result.success,
    message: result.message,
    userId: result.userId
    });

    // Need to issue Forget-password JWT Cookie
    // (input Cookie code.)
  

    return response;


  } catch (error) {
    console.error('Forget-otp API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
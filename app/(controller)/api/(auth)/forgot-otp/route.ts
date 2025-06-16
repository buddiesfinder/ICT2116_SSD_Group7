import { NextRequest, NextResponse } from 'next/server';
import { otpChecker } from '@/app/(model)/(auth)/(forgot_password)/otpChecker.route';
import { issueForgotPasswordToken } from '@/app/(model)/(auth)/(token)/(forgot_password)/issueForgotPasswordToken.route';

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

    // Need to issue Forget-password JWT Cookie
    const forgotPasswordToken = await issueForgotPasswordToken({ userId: String(result.userId) });
    if (!forgotPasswordToken.success) {
      return  NextResponse.json(
        { success: false, 
          message: forgotPasswordToken.message 
        },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
    success: forgotPasswordToken.success,
    message: forgotPasswordToken.message,
    userId: result.userId
    });

    if (forgotPasswordToken.success && typeof forgotPasswordToken.token === 'string') {
      response.cookies.set('forgot_password_token', forgotPasswordToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    } 

    return response;


  } catch (error) {
    console.error('Forget-otp API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/app/(model)/(auth)/(otp)/verifyOtp.route';
import { SecondLoginFactor } from '@/app/(model)/(auth)/(login)/2FALogin.route';

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();
    if (!userId || !otp) {
      return NextResponse.json(
        { success: false, message: 'Missing userId or OTP' },
        { status: 400 }
      );
    }

    const result = await SecondLoginFactor(userId, otp);
    console.log('LoginHandler result:', result); // just to check if the loginHandler is working

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'Invalid OTP' },
        { status: 401 }
      );
    }

     // return result in http response format (with status code)
    const response = NextResponse.json({
    success: result.success,
    message: result.message,
    userId: result.userId,
  }, { status: result.success ? 200 : 401 });

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
    console.error('Second Factor Login Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

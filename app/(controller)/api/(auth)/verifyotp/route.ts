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
    console.log('LoginHandler result:', result); // debug check

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'Invalid OTP' },
        { status: 401 }
      );
    }

    // ✅ Include role in response
    const response = NextResponse.json({
      success: result.success,
      message: result.message,
      userId: result.userId,
      role: result.role,
    }, { status: 200 });

    // ✅ Set login token
    if (result.token) {
      response.cookies.set('refresh_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      // ✅ Set role cookie (readable by frontend/middleware)
      response.cookies.set('role', result.role || '', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
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

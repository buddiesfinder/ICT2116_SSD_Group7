import { NextRequest, NextResponse } from 'next/server';
import { forgetNewPassword } from '@/app/(model)/(auth)/(forgot_password)/forgetNewPassword.route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPassword } = body;
    const forgot_password_token = request.cookies.get('forgot_password_token')?.value;

    if (!forgot_password_token) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid forgot password token' },
        { status: 400 }
      );
    }

    const result = await forgetNewPassword(forgot_password_token, newPassword);
    
    const response = NextResponse.json({
    success: result.success,
    message: result.message
    });

    return response;

  } catch (error) {
    console.error('Forget-password-reset API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
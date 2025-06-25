import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
import { resetNewPassword } from '@/app/(model)/(auth)/(reset_password)/resetPassword.route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPassword } = body;

    const tokenVerified = await verifyRefreshToken(request);

    if (!tokenVerified.success) {
      return NextResponse.json(
        { success: tokenVerified.success , message: tokenVerified.message },
        { status: 400 }
      );
    }

    console.log("Password: ", newPassword);

    const resetPassword = await resetNewPassword(tokenVerified.payload, newPassword);

    if (!resetPassword.success) {
      return NextResponse.json(
        { success: resetPassword.success, message: resetPassword.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
        { success: true, message: 'Password Reset Successful' },
        { status: 200 }
      );

  } catch (error) {
    console.error('Password-Reset API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
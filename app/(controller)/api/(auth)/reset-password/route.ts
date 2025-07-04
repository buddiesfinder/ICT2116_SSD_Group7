import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken } from '@/app/(model)/(auth)/(token)/verifyRefreshToken.route';
import { resetNewPassword } from '@/app/(model)/(auth)/(reset_password)/resetPassword.route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPassword } = body;

    const token = await request.cookies.get('refresh_token')?.value;

    if (!token) {
       return NextResponse.json(
        { success: false, message: "User not logged in" },
        { status: 401 }
      );
    }

    const tokenVerified = await verifyRefreshToken(token);

    if (!tokenVerified.success) {
      return NextResponse.json(
        { success: false, message: "User not logged in" },
        { status: 401 }
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
import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/app/(model)/(auth)/(otp)/verifyOtp.route';

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();
    console.log("Hello: ",userId);
    if (!userId || !otp) {
      return NextResponse.json(
        { success: false, message: 'Missing userId or OTP' },
        { status: 400 }
      );
    }

    const result = await verifyOtp(userId, otp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || 'Invalid OTP' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sendOtp } from '@/app/(model)/(auth)/(otp)/sendOtp.route';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId in request body' },
        { status: 400 }
      );
    }

    const result = await sendOtp(userId);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

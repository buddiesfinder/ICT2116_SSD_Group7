import { NextRequest, NextResponse } from 'next/server';
import { emailChecker } from '@/app/(model)/(auth)/(forgot_password)/emailChecker.route';

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { email, otp } = body;

    console.log("email: ", email);
    console.log("otp: ", otp);
    

  } catch (error) {
    console.error('Forget-otp API error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing login' },
      { status: 500 }
    );
  }
}
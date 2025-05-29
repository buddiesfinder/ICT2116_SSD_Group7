import { NextRequest, NextResponse } from 'next/server';
import { recaptchaVerification } from '@/app/(model)/(recaptcha)/recaptcha-verification.route';

export async function POST(request: NextRequest) {
  try {
        
    const { token } = await request.json();

    if (!token) {
        return NextResponse.json(
        { success: false, message: 'Please Verify Recaptcha.' }, 
        { status: 400 }
      );
    }
    const result = await recaptchaVerification(token);

    if (!result.success) {
        return NextResponse.json(
            {   
                success: result.success, 
                message: result.message
            }, 
        { status: 403 }
        )
    }

    return NextResponse.json(
        {   
            success: result.success, 
            message: result.message
        }, 
        { status: 200 }
    )
  } catch (error: any) {
    console.error("Recaptcha verification error:", error);

    return NextResponse.json(
      { success: false, message: 'Server error during recaptcha verification' },
      { status: 500 }
    );
  }
}
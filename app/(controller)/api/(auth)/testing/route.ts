import { NextRequest, NextResponse } from 'next/server';
import { sendEmailHandler } from '../../../../(model)/(email)/sendEmail.route'; // adjust path based on where the function lives

export async function POST(request: NextRequest) {
  try {
    const { sendTo, subject, body } = await request.json();

    if (!sendTo || !subject || !body) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendEmailHandler(sendTo, subject, body);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error: any) {
    console.error('Sending Email error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function sendEmailHandler(
    sendTo: string,
    subject: string,
    body: string,

): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const response = await fetch(process.env.EMAIL_API as string, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EMAIL_SECRET}` as string, 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: sendTo,
        subject: subject,
        body: body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Email service responded with error: ${errorText}`,
      };
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return {
      success: false,
      message: 'Failed to send email',
    };
  }
}

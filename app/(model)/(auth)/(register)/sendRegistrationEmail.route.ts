import { sendEmailHandler } from '../../(email)/sendEmail.route';

export async function sendRegistrationEmail(to: string): Promise<{ success: boolean; message: string }> {
  const subject = "Welcome to Concert Ticket Booking!";
  const body = `Hello,

Thank you for registering with us. Your account (${to}) has been successfully created.

You can now log in and start booking your favorite events.

– Concert Ticket Team`;

  return await sendEmailHandler(to, subject, body);
}

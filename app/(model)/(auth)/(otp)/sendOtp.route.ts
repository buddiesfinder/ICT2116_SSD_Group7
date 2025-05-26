import { redisSet } from '../../(gateway)/(redis)/redisSet.route';
import { sendEmailHandler } from '../../(email)/sendEmail.route';

export async function sendOtp(user_id: number, user_email: string): Promise<{
  success: boolean;
  message: string;
}> {
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      
      // Set user_id to Redis
      const redisKey = `${user_id}`;
      const result = await redisSet(redisKey, otp, 10 * 60); // Expires in 10 minutes
      if (!result.success) throw new Error(result.message);

      // Send email using handler
      const sendEmail = await sendEmailHandler(user_email, "OTP For Concert Ticket Booking Website", `Your OTP is ${otp}. \nThis will expire in 10 minutes.`)

      if (!sendEmail.success) {
        return {
          success: sendEmail.success,
          message: sendEmail.message
        }
      }

      return {
        success: true,
        message: `OTP sent successfully to user ${user_id}`,
      };
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return {
          success: false,
          message: `Failed to send OTP after ${maxRetries} attempts: ${(error as Error).message}`,
        };
      }
    }
  }

  return {
    success: false,
    message: 'Unexpected failure while sending OTP.',
  };
}

import { redisSet } from '../../(gateway)/(redis)/redisSet.route';
import { sendEmailHandler } from '../../(email)/sendEmail.route';
import { db } from '@/lib/db';

console.log('Login Email API hit!');

function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout exceeded')), ms)
    ),
  ]);
}

export async function sendOtp(user_id: number): Promise<{
  success: boolean;
  message: string;
}> {
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[sendOtp] Attempt ${attempt + 1} for user ${user_id}`);

      console.log('[sendOtp] Querying DB for user email...');
      const [rows] = await db.execute(
            'SELECT email FROM User WHERE user_id = ?',
            [user_id]
          );
          
          // Check if we found a matching user
          const users = rows as any[];
          
          if (users.length === 0) {
            console.warn('[sendOtp] No user found with this ID.');
            return {
              success: false,
              message: 'Invalid user id'
            };
          }
          
      const user_email = users[0].email;
      console.log('[sendOtp] Found user emal.');
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      console.log(`[sendOtp] Generated OTP: ${otp}`);
      
      // Set user_id to Redis
      const redisKey = `${user_id}`;
      console.log('[sendOtp] Storing OTP in Redis...');
      await withTimeout(redisSet(redisKey, otp, 10 * 60), 10000); // 10s timeout
      console.log('[sendOtp] OTP stored in Redis.');

      // Send email using handler
      console.log('[sendOtp] Sending OTP email...');
      const sendEmail = await withTimeout(
        sendEmailHandler(
          user_email,
          "OTP For Concert Ticket Booking Website",
          `Your OTP is ${otp}. \nThis will expire in 10 minutes.`
        )
      );
      console.log(`[sendOtp] Email send result: ${sendEmail.success}`);

      if (!sendEmail.success) {
        return {
          success: false,
          message: sendEmail.message
        }
      }

      return {
        success: true,
        message: `OTP sent successfully to user ${user_id}`,
      };
    } catch (error) {
      console.error(`[sendOtp] Error on attempt ${attempt + 1}: ${(error as Error).message}`);
      if (attempt === maxRetries - 1) {
        return {
          success: false,
          message: `Failed to send OTP after ${maxRetries} attempts.`,
        };
      }
    }
  }

  return {
    success: false,
    message: 'Unexpected failure while sending OTP.',
  };
}

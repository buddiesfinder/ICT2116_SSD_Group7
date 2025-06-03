import { db } from '@/lib/db'; // adjust the path as needed
import { verifyOtp } from '../(otp)/verifyOtp.route';

export async function otpChecker(
    email: string,
    otp: string
): Promise<{
  success: boolean;
  message: string;
  userId?: number; 
}> {
  try {

    // Query the database for a user with matching email and password
        const [rows] = await db.query(
          'SELECT * FROM SSD.User WHERE email = ?',
          [email]
        );
        
        // Check if we found a matching user
        const users = rows as any[];
        
        if (users.length === 0) {
          return {
            success: false,
            message: 'Email Not Found'
          };
        }

        const isVerified = await verifyOtp(users[0].user_id, otp);
        
        return {
          success: isVerified.success,
          message: isVerified.message,
          userId: users[0].user_id
        }

  } catch (error: any) {
    return {
      success: false,
      message: `OTP Checker Failed: ${error}`,
    };
  }
}

import { db } from '@/lib/db'; // adjust the path as needed
import { sendOtp } from '../(otp)/sendOtp.route';

export async function emailChecker(
    email: string
): Promise<{
  success: boolean;
  message: string;
  userId?: number; 
  showError?: boolean; 
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
            message: 'Email Not Found',
            showError: false,
          };
        }
    
        // Check if suspended
        if (users[0].suspended) {
          return {
            success: false,
            message: "User is Suspended"
          }
        }

        // Send OTP
        await sendOtp(users[0].user_id);

    return {
        success: true,
        message: "Reset password otp verification email sent.",
        userId: users[0].user_id
    }

  } catch (error: any) {
    return {
      success: false,
      message: `Email Checker Failed: ${error}`,
    };
  }
}

import { db } from '@/lib/db'; // adjust the path as needed
import { sessionInsert } from '../(session)/sessionInsert.route';
import { sendOtp } from '../(otp)/sendOtp.route';
import { issueRefreshToken } from '../(token)/issueRefreshToken.route';

export async function FirstLoginFactor(email: string, password: string): Promise<{ 
  success: boolean; 
  message: string;
  userId?: number; 
  token?: string;
  requireRecaptcha?: boolean;
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
      console.log('No matching user found');
      return {
        success: false,
        message: 'Invalid email'
      };
    }

    // Check if password matches
    if (password != users[0].password) {
      console.log("Password incorrect");

      // Increase login_attempts by 1
      const newAttempts = users[0].login_attempts + 1;
      await db.query(
        'UPDATE SSD.User SET login_attempts = ? WHERE user_id = ?',
        [newAttempts, users[0].user_id]
      );

      return {
        success: false,
        message: 'Invalid Password',
      }
    }

    // Password is correct — reset login attempts to 0
    await db.query(
      'UPDATE SSD.User SET login_attempts = 0 WHERE user_id = ?',
      [users[0].user_id]
    );
    
    // Send OTP
    await sendOtp(users[0].user_id);

    return {
      success: true,
      message: 'Login First Factor Successful',
      // token: issue_token.token,
      userId: users[0].user_id
    };
    
  } catch (error: any) {
    console.error('Login DB Error:', error);
    
    return {
      success: false,
      message: 'Failed to authenticate user'
    };
  }
}
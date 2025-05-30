import { db } from '@/lib/db'; // adjust the path as needed
import { sendOtp } from '../(otp)/sendOtp.route';

export async function FirstLoginFactor(email: string, password: string, recaptchaToken?: string): Promise<{ 
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

    // Check if suspended
    if (users[0].suspended) {
      return {
        success: false,
        message: "User is Suspended"
      }
    }

    // Prompt Reset Password after 7 attempts (does not even try to verify password)
    if (users[0].login_attempts >= 7) {
      return {
        success: false,
        message: "Exceeded password reset attempts. Please Reset password."
      }
    }

    const requiresCaptcha = users[0].login_attempts > 0 && users[0].login_attempts % 3 === 0;

    // check past login_attempts to prompt recaptcha
    if (requiresCaptcha) {

      // require recaptcha token
      // Recaptcha token not parsed from frontend
      if (!recaptchaToken) {
        return {
          success: false,
          message: 'Recaptcha required',
          requireRecaptcha: true
        };
      }
      
      // verify recaptcha
      const recaptchaResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-recaptcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken })
      });

      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        return {
          success: false,
          message: recaptchaResult.message || 'Recaptcha verification failed',
        };
      }

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
      userId: users[0].user_id
    };
    
  } catch (error: any) {
    console.error('Login DB Error:', error);
    
    return {
      success: false,
      message: error.message
    };
  }
}
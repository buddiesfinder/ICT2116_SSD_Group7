import { db } from '@/lib/db'; // adjust the path as needed
import { signJwt } from '@/lib/jwt';
import { sessionInsert } from './(session)/sessionInsert.route';
import { sendOtp } from './(otp)/sendOtp.route';
import { issueRefreshToken } from './(token)/issueRefreshToken.route';

export async function loginHandler(email: string, password: string): Promise<{ 
  success: boolean; 
  message: string;
  userId?: number; 
  token?: string;
}> {
  
  try {
    // Query the database for a user with matching email and password
    const [rows] = await db.query(
      'SELECT user_id, email, role FROM SSD.User WHERE email = ? AND password = ?',
      [email, password]
    );
    
    // Check if we found a matching user
    const users = rows as any[];
    
    if (users.length === 0) {
      console.log('No matching user found');
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }


    // Insert Session ID Token into DB
    const session_creation = await sessionInsert(users[0].user_id);
    if (!session_creation.success) {
      return {
        success: session_creation.success,
        message: session_creation.message
      }
    }
    await sendOtp(users[0].user_id, users[0].email)

    
    // Issue JWT Token (With Session_ID)
    const issue_token = await issueRefreshToken(
      {
      userId: users[0].user_id, 
      user_email: users[0].email,
      role: users[0].role,
      session_token: session_creation.session_token!,
      }
    )

    if (!issue_token.success) {
      return {
        success: issue_token.success,
        message: issue_token.message
      }
    }
 
    return {
      success: true,
      message: 'Login successful',
      token: issue_token.token
    };
    
  } catch (error: any) {
    console.error('Login DB Error:', error);
    
    return {
      success: false,
      message: 'Failed to authenticate user'
    };
  }
}
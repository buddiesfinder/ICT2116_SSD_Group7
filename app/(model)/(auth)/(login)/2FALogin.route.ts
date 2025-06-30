import { db } from '@/lib/db'; // adjust the path as needed
import { sessionInsert } from '../(session)/sessionInsert.route';
import { verifyOtp } from '../(otp)/verifyOtp.route';
import { issueRefreshToken } from '../(token)/issueRefreshToken.route';

export async function SecondLoginFactor(userId: number, otp: string): Promise<{ 
  success: boolean; 
  message: string;
  userId?: number; 
  token?: string;
  role?: string;
}> {
  
  try {    

    // Query the database for a user with matching email and password
    const [rows] = await db.execute(
      'SELECT user_id, email, role FROM User WHERE user_id = ?',
      [userId]
    );
    
    // Check if we found a matching user
    const users = rows as any[];
    
    if (users.length === 0) {
      console.log('No matching user found');
      return {
        success: false,
        message: 'Invalid user Id or Password'
      };
    }

    const verify = await verifyOtp(userId, otp);

    if (!verify.success) {
          return {
            success: verify.success,
            message: verify.message
        }
    }

    // Insert Session ID Token into DB
    const session_creation = await sessionInsert(users[0].user_id);
    if (!session_creation.success) {
      return {
        success: session_creation.success,
        message: session_creation.message
      }
    };
    
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
      message: 'Login Second Factor Successful',
      token: issue_token.token,
      userId: users[0].user_id,
      role: users[0].role 
    };
    
  } catch (error: any) {
    console.error('Login DB Error:', error);
    
    return {
      success: false,
      message: 'Failed to authenticate user'
    };
  }
}

import { db } from '@/lib/db'; // adjust the path as needed
import { signJwt } from '@/lib/jwt';
import { sessionHandler } from './sessionHandler.route';

export async function loginHandler(email: string, password: string): Promise<{ 
  success: boolean; 
  message: string;
  userId?: number; 
  token?: string;
}> {
  
  try {
    // Query the database for a user with matching email and password
    const [rows] = await db.query(
      'SELECT user_id, role FROM SSD.User WHERE email = ? AND password = ?',
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
    const session_creation = await sessionHandler(users[0].user_id);
    if (!session_creation.success) {
      return {
        success: session_creation.success,
        message: session_creation.message
      }
    }


    // Issue JWT Token (With Session_ID)
    const token = signJwt({
      // Payload 
      userId: users[0].user_id, 
      user_email: users[0].email,
      role: users[0].role,
      session_token: session_creation.session_token,
    }, 
    // Server Secret
    process.env.REFRESH_JWT as string, 
    // TTL
    { expiresIn: 7 * 24 * 60 * 60 }); // 7 days as this is the refresh token. Set token cookie name in /api/login/route.ts
    
    return {
      success: true,
      message: 'Login successful',
      token: token
    };
    
  } catch (error: any) {
    console.error('Login DB Error:', error);
    
    return {
      success: false,
      message: 'Failed to authenticate user'
    };
  }
}
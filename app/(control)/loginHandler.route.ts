import { db } from '@/lib/db'; // adjust the path as needed
import { signJwt } from '@/lib/jwt';

export async function loginHandler(email: string, password: string): Promise<{ 
  success: boolean; 
  message: string;
  userId?: number; 
  token?: string;
}> {
  console.log('Login handler called with email:', email);
  
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
    
    // Issue JWT Token
    const token = signJwt({ userId: users[0].user_id, role: users[0].role }, process.env.JWT_SECRET as string, { expiresIn: 900 });
    
    return {
      success: true,
      message: 'Login successful',
      // userId: userId,
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
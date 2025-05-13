import { db } from '@/lib/db'; // adjust the path as needed

export async function loginHandler(email: string, password: string): Promise<{ 
  success: boolean; 
  message: string;
  userId?: number; 
}> {
  console.log('Login handler called with email:', email);
  
  try {
    // Query the database for a user with matching email and password
    const [rows] = await db.query(
      'SELECT id FROM SSD.users WHERE email = ? AND password = ?',
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
    
    // User found, return success with user ID
    const userId = users[0].id;
    console.log('Login successful for user ID:', userId);
    
    return {
      success: true,
      message: 'Login successful',
      userId: userId
    };
    
  } catch (error: any) {
    console.error('Login DB Error:', error);
    
    return {
      success: false,
      message: 'Failed to authenticate user'
    };
  }
}
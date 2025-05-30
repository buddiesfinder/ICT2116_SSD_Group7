import { db } from '@/lib/db'; // adjust the path as needed

export async function emailChecker(
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

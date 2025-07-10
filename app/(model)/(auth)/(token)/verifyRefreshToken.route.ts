import { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { db } from '@/lib/db'; // adjust the path as needed
import { cookies } from 'next/headers';

export async function verifyRefreshToken(refreshToken: string): Promise<{
  success: boolean;
  message: string;
  payload?: any;
}> {
  try {
    
    if (!refreshToken) {
      return {
        success: false,
        message: 'Refresh token not found in cookies',
      };
    }   

    // verify JWT
    const valid = verifyJwt(refreshToken, process.env.REFRESH_JWT as string);

    if (!valid) {

      return {
        success: false,
        message: 'Invalid or expired refresh token',
      };
    }

    // check session
    const [rows] = await db.execute(
      `SELECT st.Token_id
      FROM Session_Token st
      INNER JOIN User u ON u.user_id = st.user_id
      WHERE u.email = ?`,
      [valid.user_email]
    );
    
    // Check if we found a matching user
    const users = rows as any[];
    
    if (users.length === 0) {
      return {
        success: false,
        message: 'Invalid User.'
      };
    }

    if (users[0].Token_id !== valid.session_token) {
       return {
        success: false,
        message: 'Invalid Session.'
      };
    }

    

    return {
      success: true,
      message: 'Token Verified successfully',
      payload: valid,
    };

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to decode refresh token',
    };
  }
}

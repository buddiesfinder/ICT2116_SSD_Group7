import { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

export async function verifyRefreshToken(refreshToken: string): Promise<{
  success: boolean;
  message: string;
  payload?: any;
}> {
  try {
    // Extract token from cookies
    // const refreshToken = request.cookies.get('refresh_token')?.value;
    
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


    return {
      success: true,
      message: 'Token decoded successfully',
      payload: valid,
    };

  } catch (error: any) {
    console.error('Token decode error:', error);
    return {
      success: false,
      message: 'Failed to decode refresh token',
    };
  }
}

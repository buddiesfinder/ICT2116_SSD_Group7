import { NextRequest } from 'next/server';
import { decodeJwt } from '@/lib/jwt';

export async function decodeRefreshToken(request: NextRequest): Promise<{
  success: boolean;
  message: string;
  payload?: any;
}> {
  try {
    // Extract token from cookies
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return {
        success: false,
        message: 'Refresh token not found in cookies',
      };
    }

    // decode JWT
    const decoded = decodeJwt(refreshToken);

    return {
      success: true,
      message: 'Token decoded successfully',
      payload: decoded,
    };

  } catch (error: any) {
    console.error('Token decode error:', error);
    return {
      success: false,
      message: 'Failed to decode refresh token',
    };
  }
}

import { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

export async function verifyForgotPasswordToken(forgot_password_token: string): Promise<{
  success: boolean;
  message: string;
  payload?: any;
}> {
  try {

    if (!forgot_password_token) {
      return {
        success: false,
        message: 'Refresh token not found in cookies',
      };
    }

    // verify JWT
    const valid = verifyJwt(forgot_password_token, process.env.FORGOT_PASSWORD_JWT as string);

    if (!valid) {
      return {
        success: false,
        message: 'Invalid or expired forget_password token',
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
      message: 'Failed to decode forget_password token',
    };
  }
}

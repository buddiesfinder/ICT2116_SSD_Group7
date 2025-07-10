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
        message: 'Invalid or expired  token',
      };
    }


    return {
      success: true,
      message: 'Token verified successfully',
      payload: valid,
    };

  } catch (error: any) {
   
    return {
      success: false,
      message: 'Failed to decode  token',
    };
  }
}

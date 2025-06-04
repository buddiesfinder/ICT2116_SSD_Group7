import { signJwt } from '@/lib/jwt';

export async function issueForgotPasswordToken (payload: {
  userId: string;
}): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> {
  try {
    const token = signJwt({
      // Payload 
      userId: payload.userId,
    }, 
    // Server Secret
    process.env.FORGOT_PASSWORD_JWT as string, 
    // TTL
    { expiresIn: 15 * 60 }); // 15 minutes
    

    return {
      success: true,
      message: 'Forgot Password token issued successfully',
      token,
    };
  } catch (error: any) {
    console.error('Token issue error:', error);
    return {
      success: false,
      message: 'Failed to issue forgot passowrd token',
    };
  }
}

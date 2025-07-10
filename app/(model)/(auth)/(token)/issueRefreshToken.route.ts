import { signJwt } from '@/lib/jwt';

export async function issueRefreshToken(payload: {
  userId: string;
  user_email: string;
  role: string;
  session_token: string;
}): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> {
  try {
     // Issue JWT Token (With Session_ID)
    const token = signJwt({
      // Payload 
      userId: payload.userId,
      user_email: payload.user_email,
      role: payload.role,
      session_token: payload.session_token,
    }, 
    // Server Secret
    process.env.REFRESH_JWT as string, 
    // TTL
    { expiresIn: 60 * 60 }); // 1 hour TTL for this is the refresh token. Set token cookie name in /api/login/route.ts
    

    return {
      success: true,
      message: 'Refresh token issued successfully',
      token,
    };
  } catch (error: any) {
    console.error('Token issue error:', error);
    return {
      success: false,
      message: 'Failed to issue refresh token',
    };
  }
}

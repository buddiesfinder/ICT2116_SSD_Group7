import { signJwt } from '@/lib/jwt';
import { NextRequest } from 'next/server';
import { verifyRefreshToken } from './verifyRefreshToken.route';

export async function issueRefreshToken(request: NextRequest
): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> {
  try {
    const refresh_token = request.cookies.get('refresh_token')?.value;

    if (!refresh_token) {
        return {
            success: false,
            message: "Refresh Token not found. Please Re-Login."
        }
    }

    const refresh_token_valid = await verifyRefreshToken(request);

    if (!refresh_token_valid.success) {
        return {
            success: refresh_token_valid.success,
            message: refresh_token_valid.message
        }
    }

    // Refresh Token Valid
    // Issue Access Token
    const access_token = signJwt({
      // Payload 
      refresh_token: refresh_token
    }, 
    // Server Secret
    process.env.ACCESS_JWT as string, 
    // TTL
    { expiresIn: 15 * 60 }); // 15 minutes
    

    return {
      success: true,
      message: 'Access token issued successfully',
      token: access_token,
    };
  } catch (error: any) {
    console.error('Token issue error:', error);
    return {
      success: false,
      message: 'Failed to issue Access token',
    };
  }
}

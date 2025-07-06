import { signJwt } from '@/lib/jwt';
import { NextRequest } from 'next/server';
import { verifyRefreshToken } from './verifyRefreshToken.route';

export async function issueAccessToken(
  refresh_token: string
  // request: NextRequest
): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> {
  try {


    if (!refresh_token) {
        return {
            success: false,
            message: "Please Re-Login."
        }
    }

    const refresh_token_valid = await verifyRefreshToken(refresh_token);

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
    return {
      success: false,
      message: 'Failed to issue Access token',
    };
  }
}

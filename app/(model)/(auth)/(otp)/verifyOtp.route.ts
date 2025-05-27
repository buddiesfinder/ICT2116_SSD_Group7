import { redisGet } from '../../(gateway)/(redis)/redisGet.route';
import { redisDel } from '../../(gateway)/(redis)/redisDel.route';

export async function verifyOtp(user_id: number, otp: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const redis_value = await redisGet(`${user_id}`);

    if (!redis_value) {
      return {
        success: false,
        message: 'OTP has expired or does not exist'
      };
    }

    if (redis_value.data === otp) {
        // Delete the otp
        // If delete fails, otp verification fails.
        const delete_otp = await redisDel(`${user_id}`);
        if (!delete_otp.success) {
            return {
                success: delete_otp.success,
                message: delete_otp.message
            }
        }
      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } else {
      return {
        success: false,
        message: 'Invalid OTP'
      };
    }
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: 'Error verifying OTP'
    };
  }
}

// lib/redisSet.ts (or any suitable location)
import redis from '@/lib/redis';

export async function redisSet(
  key: string,
  value: string,
  expiryInSeconds?: number
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (expiryInSeconds) {
      await redis.set(key, value, 'EX', expiryInSeconds);
    } else {
      await redis.set(key, value);
    }

    return {
      success: true,
      message: `Key "${key}" set successfully${expiryInSeconds ? ` with expiry of ${expiryInSeconds} seconds` : ''}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to set key "${key}": ${(error as Error).message}`,
    };
  }
}

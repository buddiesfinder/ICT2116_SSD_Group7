import redis from '@/lib/redis';

export async function redisGet(
  key: string
): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const value = await redis.get(key);
    return {
      success: true,
      message: `Key-Pair "${key}: ${value}" successfully retrieved`,
      data: value
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to retrieve value of "${key}": ${(error as Error).message}`,
    };
  }
}

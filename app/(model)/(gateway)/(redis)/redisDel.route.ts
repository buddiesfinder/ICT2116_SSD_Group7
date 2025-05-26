import redis from '@/lib/redis';

export async function redisDel(
  key: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const deleted = await redis.del(key);

    if (deleted === 0) {
      return {
        success: false,
        message: `Key "${key}" not found or already deleted.`,
      };
    }

    return {
      success: true,
      message: `Key "${key}" successfully deleted.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete key "${key}": ${(error as Error).message}`,
    };
  }
}

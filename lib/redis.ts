// // lib/redis.ts
// import Redis from "ioredis";

// const redis = new Redis({
//   host: process.env.REDIS_HOST,       // e.g., "127.0.0.1"
//   port: Number(process.env.REDIS_PORT) || 6379,
//   password: process.env.REDIS_PASSWORD, // if any
//   username: process.env.REDIS_USER, // optional
// });

// export default redis;


// lib/redis.ts
import Redis from "ioredis";

// Configuration with retry and connection options
const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USER,
  
  // Connection timeout
  connectTimeout: 10000, // 10 seconds
  lazyConnect: true, // Don't connect immediately
  
  // Retry strategy for failed connections
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  
  // Retry strategy for connection attempts
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis connection attempt ${times}, retrying in ${delay}ms`);
    return delay;
  },
  
  // Reconnect on error
  reconnectOnError: (err: Error) => {
    const targetError = "READONLY";
    return err.message.includes(targetError);
  },
  
  // Keep connection alive
  keepAlive: 30000, // 30 seconds
  
  // Connection pool settings
  family: 4, // Use IPv4
  enableOfflineQueue: false, // Don't queue commands when disconnected
};

// Create Redis instance with error handling
const redis = new Redis(redisConfig);

// Connection event handlers
redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("ready", () => {
  console.log("Redis is ready to receive commands");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("close", () => {
  console.log("Redis connection closed");
});

redis.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

redis.on("end", () => {
  console.log("Redis connection ended");
});

// Wrapper function with retry logic for operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error = new Error('No attempts made');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

// Health check function
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
};

// Graceful shutdown
export const closeRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    console.log("Redis connection closed gracefully");
  } catch (error) {
    console.error("Error closing Redis connection:", error);
  }
};

// Connection initialization with retry
export const initializeRedis = async (): Promise<void> => {
  try {
    await redis.connect();
    console.log("Redis initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
    throw error;
  }
};

export default redis;
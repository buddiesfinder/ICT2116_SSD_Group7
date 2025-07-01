// lib/redis.ts
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,       // e.g., "127.0.0.1"
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD, // if any
  username: process.env.REDIS_USER, // optional
});

export default redis;

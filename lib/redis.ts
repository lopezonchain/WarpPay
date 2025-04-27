import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
      console.warn(
        "REDIS_URL or REDIS_TOKEN environment variable is not defined, please add to enable background notifications and webhooks.",
      );
      return null;
    }

    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
  }
  return redis;
}

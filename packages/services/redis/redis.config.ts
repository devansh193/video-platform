import { RedisClient } from "./redis.services";

export const redisDriver = new RedisClient({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

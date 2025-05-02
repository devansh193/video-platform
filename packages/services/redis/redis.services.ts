import { Redis } from "@upstash/redis";

export interface RedisClientOptions {
  url: string;
  token: string;
}

export class RedisClient {
  private client: Redis;

  constructor(options: RedisClientOptions) {
    const { url, token } = options;
    if (!url?.trim()) {
      throw new Error("Redis URL is required and cannot be empty");
    }
    if (!token?.trim()) {
      throw new Error("Redis token is required and cannot be empty");
    }
    this.client = new Redis({
      url: url,
      token: token,
    });
  }

  public async get(key: string) {
    if (!key?.trim()) {
      throw new Error("Redis key cannot be empty");
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      throw new Error(
        `Failed to get value from Redis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number) {
    if (!key?.trim()) {
      throw new Error("Redis key cannot be empty");
    }
    if (ttlSeconds !== undefined && ttlSeconds <= 0) {
      throw new Error("TTL must be a positive number if provided");
    }

    try {
      const options = ttlSeconds ? { ex: ttlSeconds } : undefined;
      const result = await this.client.set<T>(key, value, options);
      if (result !== "OK") {
        throw new Error(
          `Redis SET operation failed, received unexpected response: ${result}`
        );
      }
      return result;
    } catch (error) {
      throw new Error(
        `Failed to set value in Redis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async del(key: string) {
    if (!key?.trim()) {
      throw new Error("Redis key cannot be empty");
    }
    try {
      return await this.client.del(key);
    } catch (error) {
      throw new Error(
        `Failed to delete key from Redis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async exists(key: string) {
    if (!key?.trim()) {
      throw new Error("Redis key cannot be empty");
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      throw new Error(
        `Failed to check key existence in Redis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async ping() {
    try {
      return await this.client.ping();
    } catch (error) {
      throw new Error(
        `Redis ping failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

import { Redis } from '@upstash/redis';
import { LRUCache } from 'lru-cache';
import { env } from '../config/env.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('cache-service');

class CacheService {
  private redis: Redis | null = null;
  private lru: LRUCache<string, any>;

  constructor() {
    this.lru = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 60, // 1 hour
    });

    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.redis = new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        });
        logger.info('Upstash Redis initialized');
      } catch (err) {
        logger.error({ err }, 'Failed to initialize Redis, falling back to LRU');
      }
    } else {
      logger.info('Redis not configured, using LRU cache');
    }
  }

  private prefixKey(key: string): string {
    return `onx:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const prefixedKey = this.prefixKey(key);
    try {
      if (this.redis) {
        return await this.redis.get<T>(prefixedKey);
      }
    } catch (err) {
      logger.warn({ err, key }, 'Redis get failed, falling back to LRU');
    }
    
    return (this.lru.get(prefixedKey) as T) || null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    try {
      if (this.redis) {
        if (ttlSeconds) {
          await this.redis.set(prefixedKey, value, { ex: ttlSeconds });
        } else {
          await this.redis.set(prefixedKey, value);
        }
        return;
      }
    } catch (err) {
      logger.warn({ err, key }, 'Redis set failed, falling back to LRU');
    }
    
    if (ttlSeconds) {
      this.lru.set(prefixedKey, value, { ttl: ttlSeconds * 1000 });
    } else {
      this.lru.set(prefixedKey, value);
    }
  }

  async del(key: string): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    try {
      if (this.redis) {
        await this.redis.del(prefixedKey);
        return;
      }
    } catch (err) {
      logger.warn({ err, key }, 'Redis del failed, falling back to LRU');
    }
    
    this.lru.delete(prefixedKey);
  }

  async exists(key: string): Promise<boolean> {
    const prefixedKey = this.prefixKey(key);
    try {
      if (this.redis) {
        const result = await this.redis.exists(prefixedKey);
        return result === 1;
      }
    } catch (err) {
      logger.warn({ err, key }, 'Redis exists failed, falling back to LRU');
    }
    
    return this.lru.has(prefixedKey);
  }

  async incr(key: string): Promise<number> {
    const prefixedKey = this.prefixKey(key);
    try {
      if (this.redis) {
        return await this.redis.incr(prefixedKey);
      }
    } catch (err) {
      logger.warn({ err, key }, 'Redis incr failed, falling back to LRU');
    }
    
    const val = (this.lru.get(prefixedKey) as number) || 0;
    const newVal = val + 1;
    this.lru.set(prefixedKey, newVal);
    return newVal;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    try {
      if (this.redis) {
        await this.redis.expire(prefixedKey, ttlSeconds);
        return;
      }
    } catch (err) {
      logger.warn({ err, key }, 'Redis expire failed, falling back to LRU');
    }
    
    const val = this.lru.get(prefixedKey);
    if (val !== undefined) {
      this.lru.set(prefixedKey, val, { ttl: ttlSeconds * 1000 });
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    let val = await this.get<T>(key);
    if (val !== null) {
      return val;
    }
    
    val = await factory();
    await this.set(key, val, ttlSeconds);
    return val;
  }
}

export const cache = new CacheService();

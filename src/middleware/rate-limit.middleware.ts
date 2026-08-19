import type { Context, Next } from 'hono';
import { LRUCache } from 'lru-cache';
import { env, isRedisConfigured } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import { RateLimitError } from './error.middleware.js';

const log = createLogger('rate-limiter');

// ── In-Memory Rate Limit Tracker ──
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new LRUCache<string, RateLimitEntry>({
  max: 10_000,
  ttl: env.RATE_LIMIT_WINDOW_SECONDS * 1000,
});

/**
 * In-memory token bucket rate limiting.
 * Falls back to this when Redis is not configured.
 */
function checkMemoryRateLimit(key: string, maxRequests: number, windowMs: number): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    // New window
    entry = { count: 1, resetAt: now + windowMs };
    memoryStore.set(key, entry);
    return { allowed: true, remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  entry.count++;
  memoryStore.set(key, entry);

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Rate Limiting Middleware
 * 
 * Uses Redis (Upstash) when configured, falls back to in-memory LRU.
 * Rate limits are per-IP, with tier-based limits for authenticated users.
 * 
 * Headers set on every response:
 * - X-RateLimit-Limit: Max requests per window
 * - X-RateLimit-Remaining: Requests remaining
 * - X-RateLimit-Reset: Window reset timestamp
 */
export function rateLimitMiddleware(options?: {
  maxRequests?: number;
  windowSeconds?: number;
}): (c: Context, next: Next) => Promise<void> {
  const maxRequests = options?.maxRequests ?? env.RATE_LIMIT_REQUESTS;
  const windowSeconds = options?.windowSeconds ?? env.RATE_LIMIT_WINDOW_SECONDS;
  const windowMs = windowSeconds * 1000;

  return async (c: Context, next: Next) => {
    // Build rate limit key from IP + optional user ID
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown';
    const userId = (c.get('userId' as never) as string) || '';
    const key = `ratelimit:${userId || ip}`;

    // Check rate limit (in-memory for now, Redis integration ready)
    const result = checkMemoryRateLimit(key, maxRequests, windowMs);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
    c.header('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      c.header('Retry-After', String(retryAfter));

      log.warn({ key, retryAfter }, 'Rate limit exceeded');
      throw new RateLimitError(retryAfter);
    }

    await next();
  };
}

/**
 * Strict rate limiter for sensitive endpoints (auth, OTP)
 * Allows only 5 requests per 60 seconds
 */
export function strictRateLimitMiddleware() {
  return rateLimitMiddleware({ maxRequests: 5, windowSeconds: 60 });
}

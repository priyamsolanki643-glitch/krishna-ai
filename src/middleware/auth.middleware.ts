import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { env } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import { UnauthorizedError } from './error.middleware.js';

const log = createLogger('auth');

/** User context attached after authentication */
export interface AuthUser {
  id: string;
  email: string;
  tier: string;
}

/**
 * Authentication Middleware
 * 
 * Supports three authentication methods (in priority order):
 * 1. JWT Bearer Token: `Authorization: Bearer <jwt>`
 * 2. API Key: `X-API-Key: <key>` header
 * 3. Anonymous Mode: Only in development, creates a temp user context
 */
export async function authMiddleware(c: Context, next: Next): Promise<void> {
  const authHeader = c.req.header('Authorization');
  const apiKeyHeader = c.req.header('X-API-Key');

  let user: AuthUser | null = null;

  // ── Method 1: JWT Bearer Token ──
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = await verify(token, env.JWT_SECRET, 'HS256') as {
        sub: string;
        email: string;
        tier: string;
      };

      user = {
        id: payload.sub,
        email: payload.email,
        tier: payload.tier || 'free',
      };

      log.debug({ userId: user.id, method: 'jwt' }, 'Authenticated via JWT');
    } catch (err) {
      log.warn({ error: (err as Error).message }, 'Invalid JWT token');
      throw new UnauthorizedError('Invalid or expired authentication token');
    }
  }

  // ── Method 2: API Key ──
  if (!user && apiKeyHeader) {
    // TODO: Look up API key in database to find associated user
    // For now, validate format and create temporary context
    if (apiKeyHeader.startsWith('onx_')) {
      user = {
        id: `apikey_${apiKeyHeader.slice(0, 12)}`,
        email: 'apikey@omni-nexus.ai',
        tier: 'pro',
      };
      log.debug({ method: 'api_key' }, 'Authenticated via API key');
    } else {
      throw new UnauthorizedError('Invalid API key format. Keys must start with "onx_"');
    }
  }

  // ── Method 3: Anonymous Mode (Development Only) ──
  if (!user && env.NODE_ENV === 'development') {
    user = {
      id: 'dev-anonymous-user',
      email: 'anonymous@dev.local',
      tier: 'pro',
    };
    log.debug('Anonymous dev mode — no auth required');
  }

  // ── No Authentication Provided ──
  if (!user) {
    throw new UnauthorizedError(
      'Authentication required. Provide a Bearer token or X-API-Key header.'
    );
  }

  // Attach user to context for downstream handlers
  c.set('user' as never, user);
  c.set('userId' as never, user.id);

  await next();
}

/**
 * Admin-only middleware — checks for ADMIN_SECRET
 */
export async function adminMiddleware(c: Context, next: Next): Promise<void> {
  const adminSecret = c.req.header('X-Admin-Secret');

  if (!adminSecret || adminSecret !== env.ADMIN_SECRET) {
    throw new UnauthorizedError('Admin access denied');
  }

  await next();
}

/**
 * Optional auth — attaches user if authenticated, continues without if not
 */
export async function optionalAuthMiddleware(c: Context, next: Next): Promise<void> {
  const authHeader = c.req.header('Authorization');
  const apiKeyHeader = c.req.header('X-API-Key');

  if (authHeader || apiKeyHeader) {
    try {
      await authMiddleware(c, next);
      return;
    } catch {
      // Silently continue without auth
    }
  }

  // Set anonymous user in dev mode
  if (env.NODE_ENV === 'development') {
    c.set('user' as never, {
      id: 'dev-anonymous-user',
      email: 'anonymous@dev.local',
      tier: 'free',
    } as AuthUser);
    c.set('userId' as never, 'dev-anonymous-user');
  }

  await next();
}

/**
 * Helper to extract the authenticated user from context
 */
export function getUser(c: Context): AuthUser {
  const user = c.get('user' as never) as AuthUser | undefined;
  if (!user) {
    throw new UnauthorizedError('No authenticated user in context');
  }
  return user;
}

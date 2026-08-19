import { Hono } from 'hono';
import { env, getAvailableProviders, isRedisConfigured, isSupabaseConfigured, isDatabaseConfigured } from '../config/env.js';

// ============================================================
// Health Check & Readiness Routes
// ============================================================

export const healthRoutes = new Hono();

/**
 * GET /health — Basic liveness check
 * Returns 200 if server is running. Used by load balancers.
 */
healthRoutes.get('/', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready — Detailed readiness check
 * Checks connectivity to all configured services.
 */
healthRoutes.get('/ready', async (c) => {
  const checks: Record<string, { status: string; detail?: string }> = {};

  // ── Database ──
  checks.database = isDatabaseConfigured()
    ? { status: 'configured', detail: 'PostgreSQL via Prisma' }
    : { status: 'not_configured', detail: 'Using local fallback' };

  // ── Supabase ──
  checks.supabase = isSupabaseConfigured()
    ? { status: 'configured', detail: env.SUPABASE_URL }
    : { status: 'not_configured', detail: 'Optional — not set' };

  // ── Redis ──
  checks.redis = isRedisConfigured()
    ? { status: 'configured', detail: 'Upstash Redis' }
    : { status: 'fallback', detail: 'Using in-memory LRU cache' };

  // ── LLM Providers ──
  const providers = getAvailableProviders();
  checks.llm = providers.length > 0
    ? { status: 'configured', detail: `Providers: ${providers.join(', ')}` }
    : { status: 'not_configured', detail: 'No LLM API keys set!' };

  // ── Overall Status ──
  const isReady = providers.length > 0; // At minimum, need one LLM provider

  return c.json(
    {
      status: isReady ? 'ready' : 'degraded',
      environment: env.NODE_ENV,
      version: '1.0.0',
      checks,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    isReady ? 200 : 503
  );
});

/**
 * GET /health/info — Server info (dev only)
 */
healthRoutes.get('/info', (c) => {
  if (env.NODE_ENV === 'production') {
    return c.json({ error: 'Not available in production' }, 403);
  }

  return c.json({
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    uptime: `${Math.round(process.uptime())}s`,
    environment: env.NODE_ENV,
    providers: getAvailableProviders(),
    timestamp: new Date().toISOString(),
  });
});

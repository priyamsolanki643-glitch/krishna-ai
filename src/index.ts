import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { env } from './config/env.js';
import { createLogger } from './utils/logger.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { sessionRouter } from './routes/session.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { memoryRouter } from './routes/memory.routes.js';
import { toolRouter } from './routes/tool.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import councilRoutes from './routes/council.routes.js';
import workspaceRouter from './routes/workspace.routes.js';
import { serveStatic } from '@hono/node-server/serve-static';
import { authMiddleware } from './middleware/auth.middleware.js';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware.js';
import { registerWebSearchTool } from './tools/web-search.tool.js';
import { registerCodeExecTool } from './tools/code-exec.tool.js';

// ============================================================
// Omni-Nexus / Krishna AI — Backend Entry Point
// ============================================================

const log = createLogger('server');

/** Create and configure the Hono application */
function createApp(): Hono {
  const app = new Hono();

  // ── Global Middleware ──
  app.use('*', cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-Id'],
    exposeHeaders: ['Content-Type', 'X-Request-Id'],
    maxAge: 86400,
  }));

  // ── Request Logging ──
  app.use('*', async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const requestId = crypto.randomUUID();

    c.set('requestId' as never, requestId);
    c.header('X-Request-Id', requestId);

    log.info({ method, path, requestId }, '→ Request');

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    log.info({ method, path, status, duration: `${duration}ms`, requestId }, '← Response');
  });

  // ── Error Handling ──
  app.onError(errorMiddleware);

  // ── Health Routes (no auth needed) ──
  app.use('/preview/*', serveStatic({ root: './workspaces', rewriteRequestPath: (p) => p.replace('/preview', '') }));
  app.route('/health', healthRoutes);
  app.route('/api/v1/health', healthRoutes);

  // ── Auth Routes (rate limited, no auth needed) ──
  app.route('/api/v1/auth', authRouter);

  // ── Protected API Routes (auth + rate limit) ──
  const api = new Hono();
  api.use('*', authMiddleware);
  api.use('*', rateLimitMiddleware());

  api.route('/sessions', sessionRouter);
  api.route('/chat', chatRouter);
  api.route('/memory', memoryRouter);
  api.route('/tools', toolRouter);
  api.route('/admin', adminRouter);
  api.route('/council', councilRoutes);
  api.route('/workspaces', workspaceRouter);

  app.route('/api/v1', api);

  // ── Root Info ──
  app.get('/', (c) => {
    return c.json({
      name: 'Omni-Nexus / Krishna AI',
      version: '1.0.0',
      status: 'operational',
      documentation: '/api/v1/health',
      timestamp: new Date().toISOString(),
    });
  });

  // ── 404 Handler ──
  app.notFound((c) => {
    return c.json(
      {
        error: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
        timestamp: new Date().toISOString(),
      },
      404
    );
  });

  return app;
}

/** Bootstrap and start the server */
async function bootstrap(): Promise<void> {
  const app = createApp();

  // ── Register Tools ──
  registerWebSearchTool();
  registerCodeExecTool();

  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.info('⚡ Omni-Nexus / Krishna AI — Backend Server');
  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log.info(`   Environment : ${env.NODE_ENV}`);
  log.info(`   Port        : ${env.PORT}`);
  log.info(`   Database    : ${env.DATABASE_URL ? '✅ Configured' : '⚠️  Not configured (using fallback)'}`);
  log.info(`   Supabase    : ${env.SUPABASE_URL ? '✅ Configured' : '⚠️  Not configured'}`);
  log.info(`   Redis       : ${env.UPSTASH_REDIS_REST_URL ? '✅ Configured' : '⚠️  Using in-memory cache'}`);
  log.info(`   Groq LLM    : ${env.GROQ_API_KEYS ? '✅ Configured' : '❌ Not configured'}`);
  log.info(`   Gemini LLM  : ${env.GEMINI_API_KEYS ? '✅ Configured' : '⬚  Optional'}`);
  log.info(`   OpenAI LLM  : ${env.OPENAI_API_KEY ? '✅ Configured' : '⬚  Optional'}`);
  log.info(`   Anthropic   : ${env.ANTHROPIC_API_KEY ? '✅ Configured' : '⬚  Optional'}`);
  log.info(`   DeepSeek    : ${env.DEEPSEEK_API_KEY ? '✅ Configured' : '⬚  Optional'}`);
  log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const server = serve({
    fetch: app.fetch,
    port: env.PORT,
  });

  log.info(`🚀 Server running at http://localhost:${env.PORT}`);

  // ── Graceful Shutdown ──
  const shutdown = async (signal: string) => {
    log.info(`\n🛑 ${signal} received — shutting down gracefully...`);

    server.close(() => {
      log.info('✅ Server closed');
      process.exit(0);
    });

    // Force kill after 10 seconds
    setTimeout(() => {
      log.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    log.error({ reason }, 'Unhandled Promise Rejection');
  });

  process.on('uncaughtException', (error) => {
    log.fatal({ error }, 'Uncaught Exception — shutting down');
    process.exit(1);
  });
}

// ── Start ──
bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export { createApp };


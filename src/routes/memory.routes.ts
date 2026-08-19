import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { memoryService } from '../services/memory.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('MemoryRoutes');

const memoryRouter = new Hono<{ Variables: { userId: string } }>();
memoryRouter.use('*', authMiddleware);

const searchSchema = z.object({
  query: z.string(),
  limit: z.number().optional().default(10),
  category: z.string().optional(),
});

const ingestSchema = z.object({
  content: z.string(),
  category: z.string().optional(),
});

// POST /memory/search — Semantic search over user memories
memoryRouter.post('/search', zValidator('json', searchSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { query, limit, category } = c.req.valid('json');

    const results = await memoryService.searchLongTermMemory(userId, query, limit);
    
    return c.json({
      memories: results,
      totalFound: results.length,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in /memory/search:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /memory/ingest — Store new knowledge
memoryRouter.post('/ingest', zValidator('json', ingestSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { content, category } = c.req.valid('json');

    const memoryId = await memoryService.ingestMemory(userId, content, category || 'general');

    return c.json({
      id: memoryId,
      message: 'Memory stored',
    }, 201);
  } catch (error) {
    logger.error({ err: error }, 'Error in /memory/ingest:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /memory/fingerprint — Get cognitive fingerprint
memoryRouter.get('/fingerprint', async (c) => {
  try {
    const userId = c.get('userId');
    
    const fingerprint = await memoryService.getCognitiveFingerprint(userId);

    return c.json(fingerprint);
  } catch (error) {
    logger.error({ err: error }, 'Error in /memory/fingerprint:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /memory/all — Purge all user data (GDPR)
memoryRouter.delete('/all', async (c) => {
  try {
    const userId = c.get('userId');
    
    await memoryService.purgeAllUserData(userId);

    return c.json({ message: 'All data deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Error in /memory/all:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /memory/sessions — List memory sessions
memoryRouter.get('/sessions', async (c) => {
  try {
    const userId = c.get('userId');
    
    const sessions = await memoryService.getMemorySessions(userId);

    return c.json(sessions);
  } catch (error) {
    logger.error({ err: error }, 'Error in /memory/sessions:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { memoryRouter };

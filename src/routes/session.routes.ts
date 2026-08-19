import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { db as dbService } from '../services/db.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SessionRoutes');

const sessionRouter = new Hono<{ Variables: { userId: string } }>();
sessionRouter.use('*', authMiddleware);

// Schemas
const paginationSchema = z.object({
  page: z.string().optional().default('1').transform((v) => parseInt(v, 10)),
  limit: z.string().optional().default('20').transform((v) => parseInt(v, 10)),
  search: z.string().optional(),
});

const createSessionSchema = z.object({
  title: z.string().optional(),
  modelTier: z.string().optional(),
  workspaceId: z.string().optional(),
});

const updateSessionSchema = z.object({
  title: z.string().optional(),
  modelTier: z.string().optional(),
});

// GET /sessions — List user's sessions (paginated)
sessionRouter.get('/', zValidator('query', paginationSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { page, limit, search } = c.req.valid('query');
    
    let sessions = await dbService.getSessions(userId, page, limit);

    if (search) {
      sessions = sessions.filter((s: any) => s.title && s.title.toLowerCase().includes(search.toLowerCase()));
    }

    return c.json({
      data: sessions,
      pagination: {
        page,
        limit,
        total: sessions.length,
        totalPages: 1, // Simplified for mock
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in /sessions:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /sessions — Create new session
sessionRouter.post('/', zValidator('json', createSessionSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { title, modelTier, workspaceId } = c.req.valid('json');

    const session = await dbService.createSession({
      user_id: userId,
      title: title || 'New Chat',
      model_tier: modelTier || 'BASE',
      workspace_id: workspaceId,
    });

    return c.json(session, 201);
  } catch (error) {
    logger.error({ err: error }, 'Error in POST /sessions:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /sessions/:id — Get session with full message history
sessionRouter.get('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const session = await dbService.getSession(id);

    if (!session || session.user_id !== userId) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const messages = await dbService.getMessages(id);

    return c.json({ ...session, messages });
  } catch (error) {
    logger.error({ err: error }, 'Error in GET /sessions/:id:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PATCH /sessions/:id — Update session title or modelTier
sessionRouter.patch('/:id', zValidator('json', updateSessionSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const { title, modelTier } = c.req.valid('json');

    const existingSession = await dbService.getSession(id);

    if (!existingSession || existingSession.user_id !== userId) {
      return c.json({ error: 'Session not found' }, 404);
    }

    const session = await dbService.updateSession(id, {
      ...(title && { title }),
      ...(modelTier && { model_tier: modelTier }),
    });

    return c.json(session);
  } catch (error) {
    logger.error({ err: error }, 'Error in PATCH /sessions/:id:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /sessions/:id — Delete session and all messages
sessionRouter.delete('/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const existingSession = await dbService.getSession(id);

    if (!existingSession || existingSession.user_id !== userId) {
      return c.json({ error: 'Session not found' }, 404);
    }

    await dbService.deleteSession(id);

    return c.json({ message: 'Session deleted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Error in DELETE /sessions/:id:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { sessionRouter };

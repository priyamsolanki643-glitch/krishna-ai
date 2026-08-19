import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';
import { adminService } from '../services/admin.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AdminRoutes');

const adminRouter = new Hono<{ Variables: { userId: string } }>();
// Protect all routes with auth and admin middlewares
adminRouter.use('*', authMiddleware, adminMiddleware);

const paginationSchema = z.object({
  page: z.string().optional().default('1').transform((v) => parseInt(v, 10)),
  limit: z.string().optional().default('20').transform((v) => parseInt(v, 10)),
});

// GET /admin/stats — Platform metrics
adminRouter.get('/stats', async (c) => {
  try {
    const stats = await adminService.getSystemStats();
    return c.json(stats);
  } catch (error) {
    logger.error({ err: error }, 'Error in /admin/stats:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /admin/users — User breakdown
adminRouter.get('/users', zValidator('query', paginationSchema), async (c) => {
  try {
    const { page, limit } = c.req.valid('query');
    
    const usersData = await adminService.getAllUsers();

    return c.json(usersData);
  } catch (error) {
    logger.error({ err: error }, 'Error in /admin/users:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { adminRouter };

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { toolRegistry } from '../tools/registry.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ToolRoutes');

const toolRouter = new Hono<{ Variables: { userId: string } }>();
toolRouter.use('*', authMiddleware);

const executeToolSchema = z.object({
  toolName: z.string(),
  args: z.record(z.any()),
});

// GET /tools — List available tools
toolRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    
    const tools = toolRegistry.listEnabled();

    return c.json(tools);
  } catch (error) {
    logger.error({ err: error }, 'Error in /tools:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /tools/execute — Execute a tool
toolRouter.post('/execute', zValidator('json', executeToolSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { toolName, args } = c.req.valid('json');

    const startTime = performance.now();
    
    // Inject userId into args if the tool requires it, though tools should probably get it from context.
    const result = await toolRegistry.execute(toolName, { ...args, userId });
    
    const executionTime = Math.round(performance.now() - startTime);

    return c.json({
      result,
      status: 'success',
      executionTime,
    });
  } catch (error: any) {
    logger.error(`Error executing tool ${error?.toolName || 'unknown'}:`, error);
    return c.json({
      status: 'error',
      message: error.message || 'Error executing tool',
    }, 500);
  }
});

export { toolRouter };

import { Hono } from 'hono';
import { workspaceService } from '../services/workspace.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = new Hono();

router.post('/:sessionId/deploy', authMiddleware, async (c) => {
  try {
    const sessionId = c.req.param('sessionId') as string;
    const { files } = await c.req.json();
    
    if (!files || !Array.isArray(files)) {
      return c.json({ error: 'Invalid files array' }, 400);
    }
    
    const result = await workspaceService.deployProject(sessionId, files);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default router;


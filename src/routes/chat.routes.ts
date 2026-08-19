import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { streamSSE } from 'hono/streaming';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { db as dbService } from '../services/db.service.js';
import { llmService } from '../services/llm.service.js';
import { memoryService } from '../services/memory.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ChatRoutes');

const chatRouter = new Hono<{ Variables: { userId: string } }>();
chatRouter.use('*', authMiddleware);

const chatStreamSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string(),
  modelTier: z.string().optional().default('BASE'),
  attachments: z.array(z.any()).optional(),
  enableTools: z.boolean().optional().default(true),
});

const feedbackSchema = z.object({
  messageId: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

// POST /chat/stream — Real-time streaming chat
chatRouter.post('/stream', zValidator('json', chatStreamSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { sessionId, message, modelTier, attachments, enableTools } = c.req.valid('json');

    // 2. Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await dbService.createSession({
        user_id: userId,
        title: message.substring(0, 50),
        model_tier: modelTier,
      });
      currentSessionId = newSession.id;
    } else {
      // Verify session belongs to user
      const session = await dbService.getSession(currentSessionId);
      if (!session || session.user_id !== userId) {
        return c.json({ error: 'Session not found' }, 404);
      }
    }

    // 3. Save user message to DB
    const userMessage = await dbService.createMessage({
      session_id: currentSessionId,
      role: 'USER',
      content: message,
    });

    // 4. Build context window (system prompt + memories + history)
    const context = await memoryService.buildContextWindow(userId, currentSessionId as string, message);

    // Return readable stream
    return streamSSE(c, async (stream) => {
      try {
        let fullResponse = '';
        let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
        
        await llmService.streamChat(
          {
            context,
            message,
            modelTier,
            enableTools,
            attachments,
          },
          {
            onThinking: async (text: string) => {
              await stream.writeSSE({ event: 'thinking', data: JSON.stringify({ chunk: text }) });
            },
            onMessage: async (text: string) => {
              fullResponse += text;
              await stream.writeSSE({ event: 'message', data: JSON.stringify({ chunk: text }) });
            },
            onToolStart: async (toolInfo: any) => {
              await stream.writeSSE({ event: 'tool_start', data: JSON.stringify(toolInfo) });
            },
            onToolEnd: async (toolResult: any) => {
              await stream.writeSSE({ event: 'tool_end', data: JSON.stringify(toolResult) });
            },
            onTokenUsage: (usage: any) => { tokenUsage = usage; },
          }
        );

        // 7. After stream completes, save assistant message to DB
        await dbService.createMessage({
          session_id: currentSessionId,
          role: 'ASSISTANT',
          content: fullResponse,
        });

        await stream.writeSSE({ event: 'done', data: JSON.stringify({ tokenUsage }) });
      } catch (streamError) {
        logger.error({ err: streamError }, 'Streaming error:');
        await stream.writeSSE({ event: 'error', data: JSON.stringify({ message: 'Stream failed' }) });
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in /chat/stream:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /chat/feedback — Submit feedback on a response
chatRouter.post('/feedback', zValidator('json', feedbackSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { messageId, rating, feedback } = c.req.valid('json');

    // MOCK: skip message validation because db.service.ts mock lacks getMessage
    
    // We can just log feedback for now since createFeedback isn't defined in the db stub
    logger.info({ messageId, rating, feedback }, 'Feedback received');

    return c.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Error in /chat/feedback:');
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { chatRouter };

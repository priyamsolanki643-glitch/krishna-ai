import { Context } from 'hono';
import { createLogger } from '../utils/logger.js';
import { StreamChunk } from '../types/stream.types.js';

const logger = createLogger('stream-service');

export class StreamPipeline {
  createSSEStream(generator: AsyncGenerator<StreamChunk, void, unknown>): ReadableStream {
    let isInsideThink = false;
    
    return new ReadableStream({
      async start(controller) {
        const emit = (type: string, data: any) => {
          controller.enqueue(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        try {
          for await (const chunk of generator) {
            if (chunk.type === 'tool_start') {
              emit('tool_start', chunk.data);
              continue;
            }
            if (chunk.type === 'tool_end') {
              emit('tool_end', chunk.data);
              continue;
            }
            if (chunk.type === 'done') {
              emit('done', chunk.data);
              break;
            }
            if (chunk.type === 'text') {
              const text = chunk.text || '';
              
              if (text.includes('<think>')) {
                isInsideThink = true;
                const parts = text.split('<think>');
                if (parts[0]) emit('message', { chunk: parts[0] });
                const thinkText = parts.slice(1).join('<think>');
                if (thinkText.includes('</think>')) {
                  isInsideThink = false;
                  const endParts = thinkText.split('</think>');
                  if (endParts[0]) emit('thinking', { chunk: endParts[0] });
                  if (endParts[1]) emit('message', { chunk: endParts[1] });
                } else {
                  emit('thinking', { chunk: thinkText });
                }
                continue;
              }
              
              if (isInsideThink) {
                if (text.includes('</think>')) {
                  isInsideThink = false;
                  const endParts = text.split('</think>');
                  if (endParts[0]) emit('thinking', { chunk: endParts[0] });
                  if (endParts[1]) emit('message', { chunk: endParts[1] });
                } else {
                  emit('thinking', { chunk: text });
                }
              } else {
                emit('message', { chunk: text });
              }
            }
          }
        } catch (err) {
          logger.error({ err }, 'Error in SSE stream generator');
          emit('error', { message: 'Stream generation failed' });
        } finally {
          controller.close();
        }
      }
    });
  }

  createStreamResponse(c: Context, generator: AsyncGenerator<StreamChunk, void, unknown>): Response {
    const stream = this.createSSEStream(generator);
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

export const streamService = new StreamPipeline();

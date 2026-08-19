import { z } from 'zod';
import { ModelRouter } from '../providers/router.js';

const modelRouter = new ModelRouter();

export interface LLMServiceOptions {
  prompt: string;
  systemPrompt?: string;
  schema?: z.ZodTypeAny;
}

export class LLMService {
  async generateJSON(options: LLMServiceOptions): Promise<any> {
    return {};
  }
  
  async generateStructured<T>(prompt: string, context?: string): Promise<T> {
    return {} as T;
  }
  
  async generateText(options: LLMServiceOptions): Promise<string> {
    return '';
  }

  async streamChat(options: any, callbacks: any): Promise<void> {
    try {
      // Map memory structure to LLMMessage array
      const messages: { role: 'user' | 'system' | 'assistant'; content: string }[] = [
        { role: 'system', content: options.context.system }
      ];
      if (options.context.history) {
        options.context.history.forEach((m: any) => {
          messages.push({ role: m.role.toLowerCase() as any, content: m.content });
        });
      }
      messages.push({ role: 'user', content: options.message });

      const stream = modelRouter.streamWithFallback(messages, options.modelTier as any);

      for await (const chunk of stream) {
        if (chunk.type === 'thinking' && chunk.content) {
          if (callbacks.onThinking) await callbacks.onThinking(chunk.content);
        } else if (chunk.type === 'content' && chunk.content) {
          if (callbacks.onMessage) await callbacks.onMessage(chunk.content);
        }
      }
    } catch (err: any) {
      if (callbacks.onMessage) await callbacks.onMessage(`\n\n[Error from LLM Service: ${err.message}]`);
    }
  }
}

export const llmService = new LLMService();



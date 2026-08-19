import { env } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import type { ILLMProvider, StreamChunk, TextGenerationResult, EmbeddingResult } from './provider.interface.js';
import type { LLMMessage, StreamOptions, ProviderStatus } from '../types/llm.types.js';

const log = createLogger('deepseek.provider');

export class DeepSeekProvider implements ILLMProvider {
  readonly name = 'deepseek';

  private checkConfigured() {
    if (!env.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek provider not configured — add DEEPSEEK_API_KEY to .env');
    }
  }

  isAvailable(): boolean {
    return !!env.DEEPSEEK_API_KEY;
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      available: this.isAvailable(),
      activeKeys: env.DEEPSEEK_API_KEY ? 1 : 0,
      currentKeyIndex: 0,
      cooldownUntil: null,
    };
  }

  async *streamText(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<StreamChunk> {
    this.checkConfigured();
    throw new Error('DeepSeekProvider.streamText not implemented');
  }

  async generateText(messages: LLMMessage[], options?: StreamOptions): Promise<TextGenerationResult> {
    this.checkConfigured();
    throw new Error('DeepSeekProvider.generateText not implemented');
  }

  async generateEmbeddings(text: string | string[]): Promise<EmbeddingResult[]> {
    this.checkConfigured();
    throw new Error('DeepSeekProvider.generateEmbeddings not implemented');
  }
}

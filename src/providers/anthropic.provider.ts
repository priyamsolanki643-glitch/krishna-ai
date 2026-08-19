import { env } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import type { ILLMProvider, StreamChunk, TextGenerationResult, EmbeddingResult } from './provider.interface.js';
import type { LLMMessage, StreamOptions, ProviderStatus } from '../types/llm.types.js';

const log = createLogger('anthropic.provider');

export class AnthropicProvider implements ILLMProvider {
  readonly name = 'anthropic';

  private checkConfigured() {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic provider not configured — add ANTHROPIC_API_KEY to .env');
    }
  }

  isAvailable(): boolean {
    return !!env.ANTHROPIC_API_KEY;
  }

  getStatus(): ProviderStatus {
    return {
      name: this.name,
      available: this.isAvailable(),
      activeKeys: env.ANTHROPIC_API_KEY ? 1 : 0,
      currentKeyIndex: 0,
      cooldownUntil: null,
    };
  }

  async *streamText(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<StreamChunk> {
    this.checkConfigured();
    throw new Error('AnthropicProvider.streamText not implemented');
  }

  async generateText(messages: LLMMessage[], options?: StreamOptions): Promise<TextGenerationResult> {
    this.checkConfigured();
    throw new Error('AnthropicProvider.generateText not implemented');
  }

  async generateEmbeddings(text: string | string[]): Promise<EmbeddingResult[]> {
    this.checkConfigured();
    throw new Error('AnthropicProvider.generateEmbeddings not implemented');
  }
}

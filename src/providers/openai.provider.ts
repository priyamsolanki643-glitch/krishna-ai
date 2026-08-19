import { env, parseApiKeys } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import { KEY_COOLDOWN_MS } from '../config/constants.js';
import type { ILLMProvider, StreamChunk, TextGenerationResult, EmbeddingResult } from './provider.interface.js';
import type { LLMMessage, StreamOptions, ProviderStatus } from '../types/llm.types.js';

const log = createLogger('openai.provider');

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai';
  private apiKeys: string[];
  private keyCooldowns: Map<string, number> = new Map();
  private currentKeyIndex = 0;

  constructor() {
    this.apiKeys = parseApiKeys(env.OPENAI_API_KEY || '');
    if (this.apiKeys.length === 0) {
      log.warn('OpenAI provider initialized with no API keys.');
    }
  }

  private checkConfigured() {
    if (this.apiKeys.length === 0) {
      throw new Error('OpenAI provider not configured — add OPENAI_API_KEYS to .env');
    }
  }

  isAvailable(): boolean {
    if (this.apiKeys.length === 0) return false;
    const now = Date.now();
    return this.apiKeys.some(key => (this.keyCooldowns.get(key) || 0) <= now);
  }

  getStatus(): ProviderStatus {
    const now = Date.now();
    const activeKeys = this.apiKeys.filter(key => (this.keyCooldowns.get(key) || 0) <= now).length;
    let nextCooldown: number | null = null;
    if (activeKeys === 0 && this.apiKeys.length > 0) {
      const cooldowns = Array.from(this.keyCooldowns.values());
      nextCooldown = Math.min(...cooldowns);
    }
    
    return {
      name: this.name,
      available: activeKeys > 0,
      activeKeys,
      currentKeyIndex: this.currentKeyIndex,
      cooldownUntil: nextCooldown ? new Date(nextCooldown).toISOString() : null,
    };
  }

  async *streamText(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<StreamChunk> {
    this.checkConfigured();
    throw new Error('OpenAIProvider.streamText not implemented');
  }

  async generateText(messages: LLMMessage[], options?: StreamOptions): Promise<TextGenerationResult> {
    this.checkConfigured();
    throw new Error('OpenAIProvider.generateText not implemented');
  }

  async generateEmbeddings(text: string | string[]): Promise<EmbeddingResult[]> {
    this.checkConfigured();
    throw new Error('OpenAIProvider.generateEmbeddings not implemented');
  }
}

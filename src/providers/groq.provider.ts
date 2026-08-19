import Groq from 'groq-sdk';
import { env, parseApiKeys } from '../config/env.js';
import { createLogger } from '../utils/logger.js';
import { KEY_COOLDOWN_MS } from '../config/constants.js';
import type { ILLMProvider, StreamChunk, TextGenerationResult, EmbeddingResult } from './provider.interface.js';
import type { LLMMessage, StreamOptions, ProviderStatus } from '../types/llm.types.js';

const log = createLogger('groq.provider');

export class GroqProvider implements ILLMProvider {
  readonly name = 'groq';
  private apiKeys: string[];
  private keyCooldowns: Map<string, number> = new Map();
  private currentKeyIndex = 0;

  constructor() {
    this.apiKeys = parseApiKeys(env.GROQ_API_KEYS || '');
    if (this.apiKeys.length === 0) {
      log.warn('Groq provider initialized with no API keys.');
    }
  }

  private getAvailableKey(): string {
    const now = Date.now();
    for (let i = 0; i < this.apiKeys.length; i++) {
      const index = (this.currentKeyIndex + i) % this.apiKeys.length;
      const key = this.apiKeys[index];
      const cooldownUntil = this.keyCooldowns.get(key) || 0;

      if (now >= cooldownUntil) {
        this.currentKeyIndex = (index + 1) % this.apiKeys.length;
        return key;
      }
    }
    throw new Error('All Groq API keys are currently rate-limited (cooling down).');
  }

  private markKeyCooledDown(key: string) {
    this.keyCooldowns.set(key, Date.now() + KEY_COOLDOWN_MS);
    log.warn({ keyPrefix: key.substring(0, 8) }, `Groq API key rate limited, cooling down for ${KEY_COOLDOWN_MS}ms`);
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
    const maxRetries = this.apiKeys.length;
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;
      let key: string;
      try {
        key = this.getAvailableKey();
      } catch (e) {
        throw new Error('Groq provider unavailable: All keys on cooldown.');
      }

      const client = new Groq({ apiKey: key });
      const model = options?.model || 'llama-3.3-70b-versatile';

      try {
                        // Trim massive messages in history to prevent 413
        const safeMessages = messages.map(m => {
          if (m.role === 'assistant' && m.content.length > 5000) {
            return { role: m.role as any, content: m.content.substring(m.content.length - 5000) }; // Keep only last 5000 chars for context
          }
          return { role: m.role as any, content: m.content };
        });

        const messagesStr = JSON.stringify(safeMessages);
        const estimatedPromptTokens = Math.ceil(messagesStr.length / 4);
        const maxAllowedTokens = 7500 - estimatedPromptTokens;
        const calculatedMaxTokens = Math.max(500, Math.min(6000, maxAllowedTokens));
        
        const payload = {
          messages: safeMessages,
          model,
          temperature: options?.temperature ?? 0.7,
          max_tokens: calculatedMaxTokens,
          stream: true,
        };
        log.info({ payloadSize: JSON.stringify(payload).length, payloadObj: payload }, 'Groq Payload details');
        const stream = await client.chat.completions.create(payload) as any;

        let inThinkingBlock = false;

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (!content) continue;

          if (inThinkingBlock) {
            if (content.includes('</think>') || content.includes('</thinking>')) {
              inThinkingBlock = false;
              const parts = content.split(/<\/think>|<\/thinking>/);
              if (parts[0]) yield { type: 'thinking', content: parts[0] };
              if (parts[1]) yield { type: 'content', content: parts[1] };
            } else {
              yield { type: 'thinking', content };
            }
          } else {
            if (content.includes('<think>') || content.includes('<thinking>')) {
              inThinkingBlock = true;
              const parts = content.split(/<think>|<thinking>/);
              if (parts[0]) yield { type: 'content', content: parts[0] };
              
              if (parts[1] && (parts[1].includes('</think>') || parts[1].includes('</thinking>'))) {
                   inThinkingBlock = false;
                   const subParts = parts[1].split(/<\/think>|<\/thinking>/);
                   yield { type: 'thinking', content: subParts[0] };
                   if (subParts[1]) yield { type: 'content', content: subParts[1] };
              } else if (parts[1]) {
                 yield { type: 'thinking', content: parts[1] };
              }
            } else {
              yield { type: 'content', content };
            }
          }
        }
        return; 
      } catch (error: any) {
        if (error?.status === 429) {
          this.markKeyCooledDown(key);
          log.warn(`Groq 429 rate limit hit. Attempt ${attempts}/${maxRetries}. Retrying...`);
          if (attempts >= maxRetries) {
            throw new Error('Groq provider failed: All keys rate limited after retries.');
          }
        } else {
          log.error({ err: error }, 'Groq streaming error');
          throw error;
        }
      }
    }
  }

  async generateText(messages: LLMMessage[], options?: StreamOptions): Promise<TextGenerationResult> {
    const maxRetries = this.apiKeys.length;
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;
      let key: string;
      try {
        key = this.getAvailableKey();
      } catch (e) {
        throw new Error('Groq provider unavailable: All keys on cooldown.');
      }

      const client = new Groq({ apiKey: key });
      const model = options?.model || 'llama-3.3-70b-versatile';

      try {
                const safeMessages = messages.map(m => {
          if (m.role === 'assistant' && m.content.length > 5000) {
            return { role: m.role as any, content: m.content.substring(m.content.length - 5000) };
          }
          return { role: m.role as any, content: m.content };
        });
        const messagesStr = JSON.stringify(safeMessages);
        const estimatedPromptTokens = Math.ceil(messagesStr.length / 4);
        const maxAllowedTokens = 7500 - estimatedPromptTokens;
        const calculatedMaxTokens = Math.max(500, Math.min(6000, maxAllowedTokens));

        const response = await client.chat.completions.create({
          messages: safeMessages,
          model,
          temperature: options?.temperature ?? 0.7,
          max_tokens: calculatedMaxTokens,
        });

        return {
          content: response.choices[0]?.message?.content || '',
          tokenUsage: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0,
          }
        };
      } catch (error: any) {
        if (error?.status === 429) {
          this.markKeyCooledDown(key);
          if (attempts >= maxRetries) {
            throw new Error('Groq provider failed: All keys rate limited after retries.');
          }
        } else {
          log.error({ err: error }, 'Groq generateText error');
          throw error;
        }
      }
    }
    throw new Error('Groq generateText failed.');
  }

  async generateEmbeddings(text: string | string[]): Promise<EmbeddingResult[]> {
    throw new Error('Groq does not natively support embeddings in this configuration yet.');
  }
}










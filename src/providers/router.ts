import { createLogger } from '../utils/logger.js';
import { DEFAULT_MODELS } from '../config/constants.js';
import type { ILLMProvider, StreamChunk } from './provider.interface.js';
import type { LLMMessage, StreamOptions, ModelTier } from '../types/llm.types.js';
import { GroqProvider } from './groq.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { DeepSeekProvider } from './deepseek.provider.js';

const log = createLogger('model.router');

export class ModelRouter {
  private providers: Record<string, ILLMProvider> = {};
  
  constructor() {
    this.providers['groq'] = new GroqProvider();
    this.providers['gemini'] = new GeminiProvider();
    this.providers['openai'] = new OpenAIProvider();
    this.providers['anthropic'] = new AnthropicProvider();
    this.providers['deepseek'] = new DeepSeekProvider();
  }

  private getFallbackChain(): ILLMProvider[] {
    return [
      this.providers['groq'],
      this.providers['gemini'],
      this.providers['openai'],
      this.providers['anthropic'],
      this.providers['deepseek'],
    ];
  }

  getProvider(tier: ModelTier): ILLMProvider {
    const chain = this.getFallbackChain();
    for (const provider of chain) {
      if ((provider as any).isAvailable && (provider as any).isAvailable()) {
        log.info({ tier, provider: provider.name }, 'Selected primary provider');
        return provider;
      }
    }
    throw new Error('No available LLM providers configured.');
  }

  async *streamWithFallback(messages: LLMMessage[], tier: ModelTier, options?: StreamOptions): AsyncGenerator<StreamChunk> {
    const chain = this.getFallbackChain();
    let lastError: Error | null = null;
    
    for (const provider of chain) {
      if ((provider as any).isAvailable && !(provider as any).isAvailable()) continue;
      
      try {
        log.info({ tier, provider: provider.name }, 'Attempting streaming response');
        
        const tierKey = tier.toLowerCase() as 'fast' | 'thinking' | 'creative';
        const providerName = provider.name as keyof typeof DEFAULT_MODELS;
        const defaultModel = DEFAULT_MODELS[providerName]?.[tierKey] || (DEFAULT_MODELS.groq as any).fast;

        const streamOptions = {
          ...options,
          model: options?.model || defaultModel
        };

        const stream = provider.streamText(messages, streamOptions);
        
        let yielded = false;
        for await (const chunk of stream) {
          yield chunk as any;
          yielded = true;
        }
        
        if (yielded) return; // Success

      } catch (error: any) {
        log.warn({ provider: provider.name, err: error }, 'Provider failed, falling back...');
        lastError = error;
      }
    }
    
    throw new Error(`All fallback providers failed. Last error: ${lastError?.message || 'Unknown'}`);
  }
}

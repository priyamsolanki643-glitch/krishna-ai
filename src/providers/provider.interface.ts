import type { LLMMessage, StreamOptions, TokenUsage, ProviderStatus, ToolDefinition } from '../types/llm.types.js';

export interface StreamChunk {
  type: 'thinking' | 'content' | 'tool_call' | 'tool_result';
  content: string;
  toolCall?: { id: string; name: string; arguments: string };
}

export interface TextGenerationResult {
  content: string;
  reasoning?: string;
  tokenUsage: TokenUsage;
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
}

export interface EmbeddingResult {
  embedding: number[];
  tokenUsage: TokenUsage;
}

export interface ILLMProvider {
  readonly name: string;
  streamText(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<StreamChunk>;
  generateText(messages: LLMMessage[], options?: StreamOptions): Promise<TextGenerationResult>;
  generateEmbeddings(text: string | string[]): Promise<EmbeddingResult[]>;
  getStatus(): ProviderStatus;
  isAvailable(): boolean;
}

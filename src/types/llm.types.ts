import { z } from 'zod';

export enum ModelTier {
  FAST = 'FAST',
  THINKING = 'THINKING',
  CREATIVE = 'CREATIVE',
}

export type ProviderName = 'groq' | 'gemini' | 'openai' | 'anthropic' | 'deepseek';

export const LLMMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  name: z.string().optional(),
});

export type LLMMessage = z.infer<typeof LLMMessageSchema>;

export const StreamOptionsSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  stop: z.array(z.string()).optional(),
  tools: z.array(z.any()).optional(), // Can be more specific if tool structure is known
});

export type StreamOptions = z.infer<typeof StreamOptionsSchema>;

export const TokenUsageSchema = z.object({
  prompt: z.number(),
  completion: z.number(),
  total: z.number(),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const ProviderStatusSchema = z.object({
  name: z.string(),
  available: z.boolean(),
  currentKeyIndex: z.number(),
  activeKeys: z.number().optional(),
  cooldownUntil: z.string().datetime().nullable(),
});

export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

export interface ILLMProvider {
  name: ProviderName;
  streamText(messages: LLMMessage[], options?: StreamOptions): AsyncGenerator<string, void, unknown>;
  generateText(messages: LLMMessage[], options?: StreamOptions): Promise<{ text: string; usage: TokenUsage }>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getStatus(): ProviderStatus;
}

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.any(), // Zod schema for parameters
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.any()),
  status: z.enum(['pending', 'success', 'error']),
  result: z.any().optional(),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

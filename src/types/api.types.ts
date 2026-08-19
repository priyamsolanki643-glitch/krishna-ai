import { z } from 'zod';

export const ChatStreamRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1),
  modelTier: z.enum(['FAST', 'THINKING', 'CREATIVE']).optional().default('FAST'),
  attachments: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      mimeType: z.string(),
      size: z.number(),
    })
  ).optional(),
  enableTools: z.boolean().optional().default(true),
});

export type ChatStreamRequest = z.infer<typeof ChatStreamRequestSchema>;

export const ChatStreamResponseSchema = z.object({
  messageId: z.string().uuid(),
  tokenUsage: z.object({
    prompt: z.number(),
    completion: z.number(),
    total: z.number(),
  }),
  costUsd: z.number(),
});

export type ChatStreamResponse = z.infer<typeof ChatStreamResponseSchema>;

export const CreateSessionRequestSchema = z.object({
  title: z.string().min(1).max(255),
  modelTier: z.enum(['FAST', 'THINKING', 'CREATIVE']).optional().default('FAST'),
  workspaceId: z.string().uuid().optional(),
});

export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

export const SessionResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  modelTier: z.enum(['FAST', 'THINKING', 'CREATIVE']),
  messageCount: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export const MemorySearchRequestSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(100).optional().default(10),
  category: z.enum(['preference', 'code_style', 'project_fact', 'learning_pattern', 'cognitive_fingerprint']).optional(),
});

export type MemorySearchRequest = z.infer<typeof MemorySearchRequestSchema>;

export const MemoryIngestRequestSchema = z.object({
  content: z.string().min(1),
  category: z.enum(['preference', 'code_style', 'project_fact', 'learning_pattern', 'cognitive_fingerprint']),
});

export type MemoryIngestRequest = z.infer<typeof MemoryIngestRequestSchema>;

export const OTPSendRequestSchema = z.object({
  email: z.string().email(),
});

export type OTPSendRequest = z.infer<typeof OTPSendRequestSchema>;

export const OTPVerifyRequestSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export type OTPVerifyRequest = z.infer<typeof OTPVerifyRequestSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
  expiresAt: z.string().datetime(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const PaginatedRequestSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
});

export type PaginatedRequest = z.infer<typeof PaginatedRequestSchema>;

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ToolExecuteRequestSchema = z.object({
  toolName: z.string(),
  args: z.record(z.any()),
});

export type ToolExecuteRequest = z.infer<typeof ToolExecuteRequestSchema>;

export const ToolExecuteResponseSchema = z.object({
  result: z.any(),
  status: z.enum(['success', 'error']),
  executionTime: z.number(),
});

export type ToolExecuteResponse = z.infer<typeof ToolExecuteResponseSchema>;

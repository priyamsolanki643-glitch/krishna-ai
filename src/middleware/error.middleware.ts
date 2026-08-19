import type { ErrorHandler } from 'hono';
import { createLogger } from '../utils/logger.js';

const log = createLogger('error-handler');

/**
 * Custom error types for structured API errors
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, 'NOT_FOUND', id ? `${resource} with id '${id}' not found` : `${resource} not found`);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(429, 'RATE_LIMITED', 'Too many requests. Please slow down.', { retryAfter });
  }
}

export class ProviderError extends AppError {
  constructor(provider: string, message: string) {
    super(502, 'PROVIDER_ERROR', `LLM Provider '${provider}' error: ${message}`);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'An unexpected error occurred') {
    super(500, 'INTERNAL_ERROR', message);
  }
}

/**
 * Global error handler middleware for Hono.
 * Catches all unhandled errors, logs them, and returns structured JSON responses.
 */
export const errorMiddleware: ErrorHandler = (err, c) => {
  // ── AppError (known/expected errors) ──
  if (err instanceof AppError) {
    log.warn(
      { code: err.code, status: err.statusCode, message: err.message },
      'Handled error'
    );

    return c.json(
      {
        error: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        timestamp: new Date().toISOString(),
      },
      err.statusCode as 400
    );
  }

  // ── Zod Validation Errors ──
  if (err.name === 'ZodError') {
    const zodErr = err as unknown as { issues: Array<{ path: (string | number)[]; message: string }> };
    log.warn({ issues: zodErr.issues }, 'Validation error');

    return c.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: zodErr.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
        timestamp: new Date().toISOString(),
      },
      400
    );
  }

  // ── Unknown / Unexpected Errors ──
  log.error({ err, stack: (err as Error).stack }, 'Unhandled error');

  return c.json(
    {
      error: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (err as Error).message
        : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
    500
  );
};

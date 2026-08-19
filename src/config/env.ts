import { z } from 'zod';

// ============================================================
// Environment Variable Schema & Validation
// ============================================================
// All env vars are validated at startup using Zod.
// The app will crash immediately with clear error messages
// if required variables are missing.
// ============================================================

const envSchema = z.object({
  // ── Server ──
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ── Database ──
  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // ── Redis ──
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),

  // ── Authentication ──
  JWT_SECRET: z.string().min(16).default('omni-nexus-dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(10),
  OTP_COOLDOWN_SECONDS: z.coerce.number().default(60),
  ADMIN_SECRET: z.string().default('admin-dev-secret'),

  // ── LLM Providers ──
  GROQ_API_KEYS: z.string().optional(),
  GEMINI_API_KEYS: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),

  // ── Embedding ──
  EMBEDDING_PROVIDER: z.enum(['groq', 'openai', 'gemini']).default('groq'),
  EMBEDDING_MODEL: z.string().default('llama-3.3-70b-versatile'),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(1536),

  // ── Rate Limiting ──
  RATE_LIMIT_REQUESTS: z.coerce.number().default(60),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(60),

  // ── Tools ──
  TAVILY_API_KEY: z.string().optional(),
  BRAVE_SEARCH_API_KEY: z.string().optional(),
  SERP_API_KEY: z.string().optional(),

  // ── Storage ──
  STORAGE_PROVIDER: z.enum(['supabase', 's3', 'r2']).default('supabase'),

  // ── Logging ──
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables.
 * Crashes at startup with descriptive errors if validation fails.
 */
function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`   → ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

/** Validated environment variables — safe to use everywhere */
export const env = loadEnv();

/**
 * Parse comma-separated API keys into an array.
 * Filters out empty strings.
 */
export function parseApiKeys(keys: string | undefined): string[] {
  if (!keys) return [];
  return keys
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/** Check which LLM providers are configured */
export function getAvailableProviders(): string[] {
  const providers: string[] = [];
  if (parseApiKeys(env.GROQ_API_KEYS).length > 0) providers.push('groq');
  if (parseApiKeys(env.GEMINI_API_KEYS).length > 0) providers.push('gemini');
  if (env.OPENAI_API_KEY) providers.push('openai');
  if (env.ANTHROPIC_API_KEY) providers.push('anthropic');
  if (env.DEEPSEEK_API_KEY) providers.push('deepseek');
  return providers;
}

/** Check if Redis is configured */
export function isRedisConfigured(): boolean {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_URL.length > 0 && env.UPSTASH_REDIS_REST_TOKEN && env.UPSTASH_REDIS_REST_TOKEN.length > 0);
}

/** Check if Supabase is configured */
export function isSupabaseConfigured(): boolean {
  return !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

/** Check if database is configured */
export function isDatabaseConfigured(): boolean {
  return !!env.DATABASE_URL;
}

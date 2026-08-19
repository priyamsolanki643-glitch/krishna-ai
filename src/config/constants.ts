// ============================================================
// Application-wide Constants
// ============================================================

/** Default models per provider */
export const DEFAULT_MODELS = {
  groq: {
    fast: 'qwen/qwen3.6-27b',
    thinking: 'qwen/qwen3.6-27b',
    creative: 'qwen/qwen3.6-27b',
  },
  gemini: {
    fast: 'gemini-2.0-flash',
    thinking: 'gemini-2.0-pro',
    creative: 'gemini-2.0-pro',
  },
  openai: {
    fast: 'gpt-4o-mini',
    thinking: 'o3-mini',
    creative: 'gpt-4o',
  },
  anthropic: {
    fast: 'claude-3-5-haiku-latest',
    thinking: 'claude-3-7-sonnet-latest',
    creative: 'claude-3-5-sonnet-latest',
  },
  deepseek: {
    fast: 'deepseek-chat',
    thinking: 'deepseek-reasoner',
    creative: 'deepseek-chat',
  },
} as const;

/** API key rotation cooldown when a 429 is hit */
export const KEY_COOLDOWN_MS = 60_000;

/** Maximum sliding window messages for short-term memory */
export const SHORT_TERM_MEMORY_WINDOW = 6;

/** Maximum long-term memories to retrieve via vector search */
export const MAX_VECTOR_RESULTS = 2;

/** SSE stream event types */
export const SSE_EVENTS = {
  THINKING: 'thinking',
  MESSAGE: 'message',
  TOOL_START: 'tool_start',
  TOOL_END: 'tool_end',
  STAGE_UPDATE: 'stage_update',
  TEAM_ASSEMBLED: 'team_assembled',
  DONE: 'done',
  ERROR: 'error',
} as const;

/** OTP configuration */
export const OTP_CONFIG = {
  LENGTH: 6,
  CHARSET: '0123456789',
  MAX_ATTEMPTS: 5,
} as const;

/** Multi-Agent Council Roles */
export const COUNCIL_ROLES = {
  SUPERVISOR: 'supervisor',
  CRITIC: 'critic',
  ARCHITECT: 'architect',
  PLANNER: 'planner',
  EXECUTOR: 'executor',
  COUNTERFACTUAL: 'counterfactual',
} as const;

/** 16-Layer OmniEngine layer groups */
export const OMNI_LAYERS = {
  INTAKE_INTELLIGENCE: [0, 1],
  CAPABILITY_SIMULATION: [2, 3, 4, 5],
  FRICTION_AMBITION: [6, 7, 8, 9],
  ACCOUNTABILITY_AUDIT: [10, 11, 12, 13],
  EMPATHY_TONE: [14],
  CHAOS_VOLATILITY: [15],
} as const;

/** The 4 Mentor personas */
export const MENTOR_PERSONAS = {
  VISIONARY: 'visionary',
  DRILL_SERGEANT: 'drill_sergeant',
  ACCOUNTABILITY_PARTNER: 'accountability_partner',
  CRISIS_SUPPORT: 'crisis_support',
} as const;

/** OmniEngine fast vs deep path threshold */
export const DEEP_PATH_TRIGGERS = [
  'weekly_review',
  'consecutive_failures_3plus',
  'milestone_unlock',
  'burnout_detected',
  'distress_signal',
] as const;

/** Rate limiting tiers */
export const RATE_LIMIT_TIERS = {
  free: { requests: 30, window: 60 },
  pro: { requests: 120, window: 60 },
  enterprise: { requests: 600, window: 60 },
} as const;



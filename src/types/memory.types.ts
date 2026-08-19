import { LLMMessage } from './llm.types.js';

export type MemoryCategory =
  | 'preference'
  | 'code_style'
  | 'project_fact'
  | 'learning_pattern'
  | 'cognitive_fingerprint';

export interface ShortTermMemory {
  messages: LLMMessage[];
  tokenCount: number;
}

export interface LongTermMemory {
  id: string;
  content: string;
  similarity?: number;
  category: MemoryCategory;
  createdAt: string;
}

export interface CognitiveFingerprint {
  learningStyle: string;
  technicalLevel: string;
  communicationPreference: string;
  missedConcepts: string[];
  strengths: string[];
}

export interface ContextWindow {
  systemPrompt: string;
  memories: LongTermMemory[];
  recentHistory: LLMMessage[];
  totalTokens: number;
}

export interface EpisodicMemory {
  id: string;
  content: string;
  embedding: number[];
  timestamp: string;
  relevanceScore: number;
}

export interface MemorySearchResult {
  memories: LongTermMemory[];
  totalFound: number;
}

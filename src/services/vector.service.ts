import { createLogger } from '../utils/logger.js';
import { isSupabaseConfigured, env } from '../config/env.js';

const log = createLogger('vector-service');

// ============================================================
// Vector Service — Cosine Similarity Search via Supabase/pgvector
// ============================================================

/**
 * Vector search result
 */
export interface VectorSearchResult {
  id: string;
  content: string;
  similarity: number;
  category?: string;
  createdAt: string;
}

/**
 * Compute cosine similarity between two vectors (for in-memory fallback)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Vector Search Service
 * 
 * Uses Supabase's pgvector extension for similarity search when available.
 * Falls back to in-memory cosine similarity computation.
 */
class VectorService {
  private supabase: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;
  private memoryStore: Array<{
    id: string;
    content: string;
    embedding: number[];
    category?: string;
    createdAt: string;
    userId: string;
  }> = [];

  async initialize(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        this.supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!);
        log.info('Vector service initialized with Supabase pgvector');
      } catch (error) {
        log.warn({ error: (error as Error).message }, 'Failed to initialize Supabase — using in-memory fallback');
      }
    } else {
      log.info('Vector service using in-memory fallback (no Supabase configured)');
    }
  }

  /**
   * Search for similar vectors in the database
   */
  async search(
    userId: string,
    queryEmbedding: number[],
    options: { limit?: number; category?: string; minSimilarity?: number } = {}
  ): Promise<VectorSearchResult[]> {
    const { limit = 5, category, minSimilarity = 0.3 } = options;

    // ── Supabase pgvector search ──
    if (this.supabase) {
      try {
        // Use Supabase RPC to call a pgvector similarity function
        const { data, error } = await this.supabase.rpc('match_memories', {
          query_embedding: queryEmbedding,
          match_count: limit,
          filter_user_id: userId,
          filter_category: category || null,
          similarity_threshold: minSimilarity,
        } as any);

        if (error) {
          log.warn({ err: error }, 'pgvector search failed, falling back to in-memory');
        } else if (data) {
          return (data as Array<{
            id: string;
            content: string;
            similarity: number;
            category?: string;
            created_at: string;
          }>).map((row) => ({
            id: row.id,
            content: row.content,
            similarity: row.similarity,
            category: row.category,
            createdAt: row.created_at,
          }));
        }
      } catch (error) {
        log.warn({ err: error }, 'Supabase RPC failed');
      }
    }

    // ── In-memory fallback ──
    const userMemories = this.memoryStore.filter((m) => {
      if (m.userId !== userId) return false;
      if (category && m.category !== category) return false;
      return true;
    });

    const scored = userMemories
      .map((m) => ({
        id: m.id,
        content: m.content,
        similarity: cosineSimilarity(queryEmbedding, m.embedding),
        category: m.category,
        createdAt: m.createdAt,
      }))
      .filter((m) => m.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return scored;
  }

  /**
   * Store a vector embedding
   */
  async store(
    userId: string,
    content: string,
    embedding: number[],
    category?: string
  ): Promise<string> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // ── Supabase storage ──
    if (this.supabase) {
      try {
        const { error } = await this.supabase.from('memories').insert({
          id,
          user_id: userId,
          content,
          embedding: JSON.stringify(embedding),
          category,
          created_at: createdAt,
        } as any);

        if (error) {
          log.warn({ err: error }, 'Supabase insert failed, storing in-memory');
        } else {
          log.info({ id, category }, 'Memory stored in Supabase');
          return id;
        }
      } catch (error) {
        log.warn({ err: error }, 'Supabase storage failed');
      }
    }

    // ── In-memory fallback ──
    this.memoryStore.push({ id, userId, content, embedding, category, createdAt });
    log.info({ id, category, storeSize: this.memoryStore.length }, 'Memory stored in-memory');
    return id;
  }

  /**
   * Delete all vectors for a user
   */
  async deleteUserVectors(userId: string): Promise<number> {
    // Supabase
    if (this.supabase) {
      try {
        const { error, count } = await this.supabase
          .from('memories')
          .delete({ count: 'exact' } as any)
          .eq('user_id', userId);

        if (!error) {
          log.info({ userId, deleted: count }, 'User vectors deleted from Supabase');
          return count || 0;
        }
      } catch (error) {
        log.warn({ err: error }, 'Supabase delete failed');
      }
    }

    // In-memory
    const before = this.memoryStore.length;
    this.memoryStore = this.memoryStore.filter((m) => m.userId !== userId);
    const deleted = before - this.memoryStore.length;
    log.info({ userId, deleted }, 'User vectors deleted from memory');
    return deleted;
  }

  /**
   * Get memory store size (for monitoring)
   */
  getStats(): { totalMemories: number; backend: string } {
    return {
      totalMemories: this.memoryStore.length,
      backend: this.supabase ? 'supabase_pgvector' : 'in_memory',
    };
  }
}

/** Singleton vector service */
export const vectorService = new VectorService();

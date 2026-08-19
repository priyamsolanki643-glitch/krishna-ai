import { createLogger } from '../utils/logger.js';
import { cache } from './cache.service.js';
import crypto from 'crypto';

const logger = createLogger('embedding-service');

export class EmbeddingService {
  private readonly dimension = 1536;

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const hash = crypto.createHash('sha256').update(text).digest('hex');
      const cacheKey = `embedding:${hash}`;
      
      const cached = await cache.get<number[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const vector = Array.from({ length: this.dimension }, () => Math.random() * 2 - 1);
      
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      const normalized = vector.map(val => val / magnitude);
      
      await cache.set(cacheKey, normalized, 60 * 60 * 24);
      return normalized;
    } catch (err) {
      logger.error({ err }, 'Failed to generate embedding');
      return new Array(this.dimension).fill(0);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      return await Promise.all(texts.map(t => this.generateEmbedding(t)));
    } catch (err) {
      logger.error({ err }, 'Failed to generate embeddings');
      return texts.map(() => new Array(this.dimension).fill(0));
    }
  }
}

export const embeddingService = new EmbeddingService();

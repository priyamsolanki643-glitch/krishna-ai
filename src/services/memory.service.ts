import { createLogger } from '../utils/logger.js';
import { db } from './db.service.js';
import { cache } from './cache.service.js';
import { embeddingService } from './embedding.service.js';

const logger = createLogger('memory-service');

const SHORT_TERM_MEMORY_WINDOW = 4;
const MAX_VECTOR_RESULTS = 5;

export class MemoryService {
  async getShortTermContext(sessionId: string, maxMessages = SHORT_TERM_MEMORY_WINDOW) {
    try {
      const msgs = await db.getRecentMessages(sessionId, maxMessages);
      return msgs;
    } catch (err) {
      logger.error({ err }, 'Failed to get short term context');
      return [];
    }
  }

  async searchLongTermMemory(userId: string, query: string, limit = MAX_VECTOR_RESULTS) {
    try {
      const embedding = await embeddingService.generateEmbedding(query);
      const results = await db.searchMemories(userId, embedding, limit);
      return results;
    } catch (err) {
      logger.error({ err }, 'Failed to search long term memory');
      return [];
    }
  }

  async ingestMemory(userId: string, content: string, category: string) {
    try {
      const embedding = await embeddingService.generateEmbedding(content);
      const memory = await db.createMemory({
        user_id: userId,
        content,
        category,
        embedding,
        created_at: new Date().toISOString()
      });
      return memory;
    } catch (err) {
      logger.error({ err }, 'Failed to ingest memory');
      throw err;
    }
  }

  async buildContextWindow(userId: string, sessionId: string, currentMessage: string) {
    try {
      const shortTerm = await this.getShortTermContext(sessionId);
      const longTerm = await this.searchLongTermMemory(userId, currentMessage);
      
      const systemPrompt = `You are Krishna AI, an expert software architect and full-stack developer (the 'Council of Experts').
Your goal is to build BEAUTIFUL, modern, and production-ready applications.
CRITICAL RULE 1: NEVER provide code snippets in plain markdown.
CRITICAL RULE 2: To prevent token limits, you MUST provide the project files ONE BY ONE.
Format EACH file like this:
<file path="filename.ext">
<![CDATA[
  ... code ...
]]>
</file>
CRITICAL RULE 3: After writing ONE <file> block, if there are MORE files needed (e.g. style.css, script.js), end your response EXACTLY with:
MORE_FILES_PENDING
Do NOT write the next file until the user says "continue".
If you have written the final file, end your response EXACTLY with:
ALL_FILES_DONE
CRITICAL RULE 4 (UI/UX MASTER RULE): You are an elite UI/UX designer. For ANY app requested, apply modern design principles: 1) Use smooth animations and hover effects. 2) Ensure generous padding/margins. 3) GUARANTEE perfect color contrast. 4) Use glassmorphism, subtle box-shadows, and beautiful gradients. 5) ALWAYS use Tailwind CSS comprehensively.
CRITICAL RULE 5: DO NOT use fake/dummy/hardcoded mock data. App must start with an EMPTY state and ONLY show data the user actually inputs. Use localStorage to persist user inputs realistically.
CRITICAL RULE 6: Create modular files (index.html, style.css, script.js). Do NOT put everything in index.html. You MUST write them ONE BY ONE across multiple turns.
CRITICAL RULE 7: Output ONLY the <file> block and the completion status text. No other conversational text.

CRITICAL RULE 9 (CODE ROBUSTNESS): Write highly robust JavaScript. Handle edge cases. If using complex APIs (like Drag-and-Drop, Canvas, or WebAudio), add necessary event listeners and state management to prevent bugs. NEVER embed large data like GeoJSON state coordinates or base64 images. ALWAYS fetch them dynamically from public URLs (e.g. unpkg, githubusercontent) to save code size.`;

      return {
        system: systemPrompt,
        memories: longTerm,
        history: shortTerm,
        current: currentMessage
      };
    } catch (err) {
      logger.error({ err }, 'Failed to build context window');
      throw err;
    }
  }

  async getCognitiveFingerprint(userId: string) {
    try {
      const cacheKey = `cognitive_fingerprint:${userId}`;
      let profile = await cache.get<any>(cacheKey);
      if (!profile) {
        profile = { userId, style: 'curious', level: 'intermediate' };
        await cache.set(cacheKey, profile, 60 * 60);
      }
      return profile;
    } catch (err) {
      logger.error({ err }, 'Failed to get cognitive fingerprint');
      return { userId, fallback: true };
    }
  }

  async updateCognitiveFingerprint(userId: string, updates: any) {
    try {
      const profile = await this.getCognitiveFingerprint(userId);
      const updated = { ...profile, ...updates };
      await cache.set(`cognitive_fingerprint:${userId}`, updated, 60 * 60);
      return updated;
    } catch (err) {
      logger.error({ err }, 'Failed to update cognitive fingerprint');
      return null;
    }
  }
  async purgeAllUserData(userId: string) {
    try {
      await db.deleteUserData(userId);
      return true;
    } catch (err) {
      logger.error({ err }, 'Failed to purge user data');
      throw err;
    }
  }

  async getMemorySessions(userId: string) {
    try {
      return await db.getSessions(userId);
    } catch (err) {
      logger.error({ err }, 'Failed to get memory sessions');
      throw err;
    }
  }
}
export const memoryService = new MemoryService();








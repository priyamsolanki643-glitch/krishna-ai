/**
 * In-Memory Query Session Store
 * 
 * NOTE: Temporary in-memory cache to store recent query results by queryId for /api/chat/argue.
 * Will be replaced by persistent PostgreSQL / Redis storage in Phase 5.
 */

export interface CachedQuerySession {
  queryId: string;
  query: string;
  finalDraft: string;
  leadDraft?: string;
  reviewerCritique?: string;
  criticObjection?: string;
  timestamp: number;
}

const queryStore = new Map<string, CachedQuerySession>();
const MAX_SESSIONS = 500;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function saveQuerySession(session: CachedQuerySession): void {
  // Evict oldest if exceeding limit
  if (queryStore.size >= MAX_SESSIONS) {
    const oldestKey = queryStore.keys().next().value;
    if (oldestKey) queryStore.delete(oldestKey);
  }
  queryStore.set(session.queryId, session);
}

export function getQuerySession(queryId: string): CachedQuerySession | undefined {
  const session = queryStore.get(queryId);
  if (!session) return undefined;
  if (Date.now() - session.timestamp > TTL_MS) {
    queryStore.delete(queryId);
    return undefined;
  }
  return session;
}

import { getDb } from "./index.js";
import { queries, agentCalls, InsertQueryRow, InsertAgentCallRow } from "./schema.js";
import { eq } from "drizzle-orm";

export async function logQueryTelemetry(
  queryData: InsertQueryRow,
  calls: Omit<InsertAgentCallRow, "queryId">[]
) {
  const db = getDb();
  if (!db) {
    console.log(`[Telemetry Log-Only] DB not connected. Saved query ${queryData.id} to memory.`);
    return;
  }

  try {
    await db.insert(queries).values(queryData).onConflictDoUpdate({
      target: queries.id,
      set: queryData,
    });

    if (calls.length > 0) {
      const callsWithQueryId = calls.map((c) => ({
        ...c,
        queryId: queryData.id,
      }));
      await db.insert(agentCalls).values(callsWithQueryId);
    }

    console.log(`📊 [PostgreSQL Telemetry] Persisted query run ${queryData.id} and ${calls.length} agent calls.`);
  } catch (err: any) {
    console.error(`❌ [PostgreSQL Telemetry Error] Failed to persist telemetry: ${err.message}`);
  }
}

export async function getPersistedQuery(queryId: string) {
  const db = getDb();
  if (!db) return null;

  try {
    const rows = await db.select().from(queries).where(eq(queries.id, queryId)).limit(1);
    return rows[0] || null;
  } catch (err: any) {
    console.error(`❌ [PostgreSQL Query Error] Failed to fetch query ${queryId}: ${err.message}`);
    return null;
  }
}

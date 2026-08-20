import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }

  return drizzle(pool, { schema });
}

export async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL not set. Skipping Postgres table initialization.");
    return;
  }

  const p = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
  });

  try {
    const client = await p.connect();
    // Auto-create tables if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS queries (
        id TEXT PRIMARY KEY,
        timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
        query_text TEXT NOT NULL,
        domain TEXT,
        emotion TEXT,
        final_answer TEXT NOT NULL,
        total_rounds INTEGER NOT NULL,
        stop_reason TEXT,
        critic_flagged BOOLEAN DEFAULT FALSE,
        is_mock BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS agent_calls (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        query_id TEXT REFERENCES queries(id) ON DELETE CASCADE NOT NULL,
        role TEXT NOT NULL,
        model_used TEXT NOT NULL,
        round_number INTEGER DEFAULT 1 NOT NULL,
        confidence DOUBLE PRECISION,
        duration_ms DOUBLE PRECISION,
        timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    client.release();
    console.log("✅ PostgreSQL tables initialized successfully (queries, agent_calls).");
  } catch (err: any) {
    console.error("❌ Failed to initialize PostgreSQL tables:", err.message);
  } finally {
    await p.end();
  }
}

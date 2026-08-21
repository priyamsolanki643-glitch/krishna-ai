import { pgTable, text, timestamp, integer, boolean, doublePrecision, uuid } from "drizzle-orm/pg-core";

export const queries = pgTable("queries", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  queryText: text("query_text").notNull(),
  domain: text("domain"),
  emotion: text("emotion"),
  finalAnswer: text("final_answer").notNull(),
  totalRounds: integer("total_rounds").notNull(),
  stopReason: text("stop_reason"),
  criticFlagged: boolean("critic_flagged").default(false),
  routingMode: text("routing_mode").default("auto"),
  researchProvider: text("research_provider"),
  isMock: boolean("is_mock").default(false),
});

export const agentCalls = pgTable("agent_calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  queryId: text("query_id").references(() => queries.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  modelUsed: text("model_used").notNull(),
  roundNumber: integer("round_number").default(1).notNull(),
  confidence: doublePrecision("confidence"),
  durationMs: doublePrecision("duration_ms"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type QueryRow = typeof queries.$inferSelect;
export type InsertQueryRow = typeof queries.$inferInsert;
export type AgentCallRow = typeof agentCalls.$inferSelect;
export type InsertAgentCallRow = typeof agentCalls.$inferInsert;

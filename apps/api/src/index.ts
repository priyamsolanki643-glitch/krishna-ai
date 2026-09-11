import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { isMockMode } from "./lib/groq.js";
import { initDb } from "./db/index.js";
import { randomUUID } from "node:crypto";
import { v2Router } from "./routes/v2.js";

// -------------------------------------------------------------
// Startup Environment Check
// -------------------------------------------------------------
function verifyEnvironment() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("🚨 FATAL: Missing GEMINI_API_KEY. Please set it in Cloud Run Variables.");
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    console.warn("⚠️ Production WARNING: DATABASE_URL not set. Falling back to in-memory mode.");
  }
}

verifyEnvironment();
initDb().catch((err) => console.error("Database init failed:", err.message));

const app = new Hono();

// ─── CORS must be registered BEFORE any route handlers ───────────
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-user-groq-key"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400,
  })
);

// ─── Token Bucket Rate Limiting ──────────────────────────────────
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();
const RATE_LIMIT_CAPACITY = 20;
const REFILL_RATE_PER_SEC = 2;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = rateLimitMap.get(ip);
  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_CAPACITY, lastRefill: now };
    rateLimitMap.set(ip, bucket);
  }
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(RATE_LIMIT_CAPACITY, bucket.tokens + elapsed * REFILL_RATE_PER_SEC);
  bucket.lastRefill = now;
  if (bucket.tokens >= 1) { bucket.tokens -= 1; return true; }
  return false;
}

// ─── Route registration (V2 primary + V1 backward compatibility) ─
app.route("/api/v2", v2Router);
app.route("/api", v2Router); // Seamlessly handles POST /api/chat/stream for older frontend clients

// ─── Health Check ────────────────────────────────────────────────
app.get("/health", (c) =>
  c.json({
    status: "ok",
    version: "2.2",
    engine: "The Council — Multi-Agent AI Orchestration Engine",
    innovations: [
      "ADAS (Automated Design of Agentic Systems — Dynamic DAG Generation)",
      "Cognitive Self-Play (Proposer→Solver→Critic Autonomous Improvement)",
      "Epistemic State Sharing (Claim-Level Uncertainty Quantification)",
      "Counterfactual Probing Protocol (LLM-Based Consistency Checks)",
      "Epistemic Debt Ledger (Correlation-Adjusted Bayesian Tracking)",
      "Attractor State Diversity Maintenance (Semantic Variance Monitoring)",
    ],
    is_mock: isMockMode(),
  })
);

app.get("/", (c) =>
  c.json({
    service: "The Council API",
    version: "2.2",
    status: "online",
    endpoints: {
      health: "GET /health",
      v2_health: "GET /api/v2/health",
      chat_stream_v2: "POST /api/v2/chat/stream",
      chat_stream_v1_alias: "POST /api/chat/stream",
      selfplay: "POST /api/v2/selfplay/run",
    },
  })
);

// ─── Server Boot ─────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "8080");
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 The Council API v2.2 running on port ${PORT}`);
  console.log(`   Engine: Gemini 2.0 Flash Multi-Agent Deliberation`);
  console.log(`   Research Architectures:`);
  console.log(`     1. ADAS — Dynamic Agent Topology Generation`);
  console.log(`     2. Self-Play — Autonomous Proposer→Solver→Critic Triad`);
  console.log(`     3. Epistemic State — Claim-Level Uncertainty Bounds`);
  console.log(`     4. Counterfactual Probing — Stress-Testing Causal Assertions`);
  console.log(`     5. Epistemic Debt Ledger — Correlation-Adjusted Confidence Decay`);
  console.log(`     6. Attractor Diversity — Semantic Entropy Monitoring`);
  console.log(`   Endpoint: http://localhost:${PORT}/api/v2/health`);
});

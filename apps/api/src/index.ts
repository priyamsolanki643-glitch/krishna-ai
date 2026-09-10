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

// ─── Route registration AFTER middleware ─────────────────────────
app.route("/api/v2", v2Router);

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

// ─── Health Check ────────────────────────────────────────────────
app.get("/health", (c) =>
  c.json({
    status: "ok",
    version: "2.2",
    engine: "The Council — Multi-Agent AI Orchestration",
    innovations: [
      "ADAS (Automated Design of Agentic Systems)",
      "Self-Play (Proposer→Solver→Critic Loop)",
      "Epistemic State Sharing (Claim-Level Uncertainty)",
      "Counterfactual Consensus Protocol (Pearl Do-Calculus)",
      "Epistemic Debt Compounding (Bayesian Propagation)",
      "Attractor State Collapse Prevention (Cognitive Entropy)",
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
      chat: "POST /api/v2/chat/stream",
      selfplay: "POST /api/v2/selfplay/run",
    },
  })
);

// ─── Legacy V1 Chat (rate-limited) ───────────────────────────────
app.post("/api/chat/stream", async (c) => {
  const clientIp = c.req.header("x-forwarded-for") || "local";
  if (!checkRateLimit(clientIp)) {
    return c.json({ error: "Rate limit exceeded. Use /api/v2/chat/stream instead." }, 429);
  }
  const body = await c.req.json().catch(() => ({}));
  if (!body.query) return c.json({ error: "Missing 'query' field" }, 400);
  return c.json({
    message: "V1 endpoint deprecated. Please migrate to POST /api/v2/chat/stream",
    v2_endpoint: "/api/v2/chat/stream",
  }, 301);
});

// ─── Server Boot ─────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "8080");
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 The Council API v2.2 running on port ${PORT}`);
  console.log(`   Engine: Gemini 2.0 Flash Ensemble`);
  console.log(`   6 Research Innovations:`);
  console.log(`     1. ADAS — Self-Designing Agent Pipelines`);
  console.log(`     2. Self-Play — Proposer→Solver→Critic Loop`);
  console.log(`     3. Epistemic State — Claim-Level Uncertainty`);
  console.log(`     4. Counterfactual Protocol — Pearl Do-Calculus`);
  console.log(`     5. Epistemic Debt — Bayesian Confidence Propagation`);
  console.log(`     6. Attractor Prevention — Cognitive Entropy Maintenance`);
  console.log(`   V2 Endpoint: http://localhost:${PORT}/api/v2/health`);
});

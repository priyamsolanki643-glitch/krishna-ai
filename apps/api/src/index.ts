import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { isMockMode } from "./lib/groq.js";
import { runSupervisor } from "./pipeline/supervisor.js";
import { runDebateLoop } from "./pipeline/loop.js";
import { mergeTeamOutputs } from "./pipeline/compiler.js";
import { runResponseArchitect } from "./pipeline/responseArchitect.js";
import { runSafetyCheck } from "./pipeline/safety.js";
import { runArgumentRuling } from "./pipeline/argue.js";
import { saveQuerySession, getQuerySession } from "./lib/queryStore.js";
import { initDb } from "./db/index.js";
import { logQueryTelemetry, getPersistedQuery } from "./db/telemetryRepo.js";
import { randomUUID } from "node:crypto";

// -------------------------------------------------------------
// STEP 2: Strict Startup Environment & Secrets Hygiene Check
// -------------------------------------------------------------
function verifyEnvironment() {
  const missingVars: string[] = [];
  if (!process.env.GROQ_API_KEY) missingVars.push("GROQ_API_KEY");

  // In production, we strongly check DATABASE_URL
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    console.warn("⚠️ Production WARNING: DATABASE_URL is not set. Postgres persistence will fallback to in-memory mode.");
  }

  if (missingVars.length > 0) {
    console.error(`🚨 FATAL STARTUP ERROR: Missing required environment variables: ${missingVars.join(", ")}`);
    console.error("Please configure your .env file according to .env.example before launching.");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

verifyEnvironment();
initDb().catch((err) => console.error("Database connection initialization failed:", err.message));

const app = new Hono();

// -------------------------------------------------------------
// STEP 3: Basic IP-based Token Bucket Rate Limiting Middleware
// -------------------------------------------------------------
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitMap = new Map<string, RateLimitBucket>();
const RATE_LIMIT_CAPACITY = 20; // Max 20 requests burst
const REFILL_RATE_PER_SEC = 2;   // 2 tokens refilled per second

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = rateLimitMap.get(ip);

  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_CAPACITY, lastRefill: now };
    rateLimitMap.set(ip, bucket);
  }

  const elapsedTimeSec = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(RATE_LIMIT_CAPACITY, bucket.tokens + elapsedTimeSec * REFILL_RATE_PER_SEC);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}

const MAX_QUERY_LENGTH = 4000; // Abuse protection: Max 4000 characters per query

// Health Check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    is_mock: isMockMode(),
  });
});

// Root Info
app.get("/", (c) => {
  return c.json({
    service: "The Council API",
    status: "online",
    is_mock: isMockMode(),
  });
});

// Streaming Multi-Agent Deliberation Endpoint
app.post("/api/chat/stream", async (c) => {
  try {
    const clientIp = c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || "local";
    
    // Rate Limiting Check
    if (!checkRateLimit(clientIp)) {
      return c.json({ 
        error: "Too Many Requests. Rate limit exceeded (20 requests burst, 2 req/sec refill). Please throttle your requests." 
      }, 429);
    }

    const body = await c.req.json();
    const query = body.query;
    const manualTeam = body.manualTeam as string[] | undefined;

    if (!query) {
      return c.json({ error: "Missing 'query' field in JSON body" }, 400);
    }

    // Input Length Abuse Guard
    if (query.length > MAX_QUERY_LENGTH) {
      return c.json({ 
        error: `Query exceeds maximum allowed length of ${MAX_QUERY_LENGTH} characters. Query length: ${query.length}` 
      }, 400);
    }

    const queryId = body.queryId || randomUUID();
    const startTime = Date.now();

    return streamSSE(c, async (stream) => {
      let qualifyingDomains: { domain: any; score: number }[] = [];
      let toneInstruction = "Provide a direct, technical, and clear explanation.";
      let supervisorEmotion: any = "neutral";
      let supervisorPrimaryDomain: any = "general";
      let isMockExecution = isMockMode();

      let customLeadModel: string | undefined = undefined;
      let customReviewerModel: string | undefined = undefined;

      // 1. Manual Team or Supervisor Stage
      if (manualTeam && manualTeam.length > 0) {
        customLeadModel = manualTeam[0];
        customReviewerModel = manualTeam[1] || undefined;

        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({
            stage: "custom_team_selection",
            message: `Bypassing Supervisor domain scoring. Using custom team: Lead (${customLeadModel})${customReviewerModel ? `, Reviewer (${customReviewerModel})` : ""}...`,
            manualTeam,
            is_mock: isMockMode(),
          }),
        });

        qualifyingDomains = [{ domain: "general", score: 1.0 }];
      } else {
        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({
            stage: "supervisor",
            message: "Supervisor analyzing query domain and emotional state...",
            is_mock: isMockMode(),
          }),
        });

        const supervisor = await runSupervisor(query);
        toneInstruction = supervisor.tone_instruction;
        supervisorEmotion = supervisor.emotion;
        supervisorPrimaryDomain = supervisor.domain;
        isMockExecution = supervisor.is_mock;

        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({
            stage: "supervisor_complete",
            domain: supervisor.domain,
            domains: supervisor.domains || [{ domain: supervisor.domain, score: 1.0 }],
            emotion: supervisor.emotion,
            tone_instruction: supervisor.tone_instruction,
            is_mock: supervisor.is_mock,
          }),
        });

        const multiDomains = (supervisor.domains || []).filter((d) => d.score >= 0.6);
        qualifyingDomains = multiDomains.length >= 2 ? multiDomains : [{ domain: supervisor.domain, score: 1.0 }];
      }

      let finalRawDraft = "";
      let totalRounds = 0;
      let stopReason: any = "approved";
      let leadConfidenceHistory: number[] = [];
      let criticFlagged = false;

      if (!manualTeam && qualifyingDomains.length >= 2) {
        // Multi-Team Parallel Execution
        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({
            stage: "multi_team_start",
            message: `Detected multi-domain query. Spawning ${qualifyingDomains.length} parallel specialized teams: ${qualifyingDomains.map(d => d.domain).join(", ")}...`,
            domains: qualifyingDomains,
            is_mock: isMockMode(),
          }),
        });

        const teamResults = await Promise.all(
          qualifyingDomains.map(async (d) => {
            const domainTone = `${toneInstruction} (Focus explicitly on the ${d.domain} domain facet)`;
            const res = await runDebateLoop(query, domainTone, async (progress) => {
              await stream.writeSSE({
                event: "thinking",
                data: JSON.stringify({ ...progress, team_domain: d.domain, is_mock: isMockMode() }),
              });
            });
            return { domain: d.domain, result: res };
          })
        );

        totalRounds = Math.max(...teamResults.map(t => t.result.rounds));
        stopReason = teamResults.some(t => t.result.stopReason === "agent_failure_circuit_breaker")
          ? "agent_failure_circuit_breaker"
          : teamResults[0].result.stopReason;
        leadConfidenceHistory = teamResults[0].result.leadConfidenceHistory;
        criticFlagged = teamResults.some(t => t.result.critic_flagged);
        isMockExecution = isMockExecution || teamResults.some(t => t.result.is_mock);

        if (stopReason === "agent_failure_circuit_breaker") {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({
              message: "agent_failure_circuit_breaker: Specialized agents failed to reach consensus. Please try again.",
              rounds: totalRounds,
              is_mock: isMockExecution
            }),
          });
          return;
        }

        // Merge with Compiler Agent
        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({
            stage: "compiler_synthesis",
            message: "Compiler Agent synthesizing multi-team outputs into unified draft...",
            is_mock: isMockMode(),
          }),
        });

        finalRawDraft = await mergeTeamOutputs(query, teamResults);
      } else {
        // Single Team Execution (Default or Manual Team)
        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({
            stage: "debate_start",
            message: "Starting Lead, Reviewer, and Critic deliberation loop...",
            is_mock: isMockMode(),
          }),
        });

        const debate = await runDebateLoop(
          query,
          toneInstruction,
          async (progress) => {
            await stream.writeSSE({
              event: "thinking",
              data: JSON.stringify({ ...progress, is_mock: isMockMode() }),
            });
          },
          {
            leadModel: customLeadModel,
            reviewerModel: customReviewerModel,
          }
        );

        if (debate.stopReason === "agent_failure_circuit_breaker") {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({
              message: "agent_failure_circuit_breaker: Agents failed consensus check due to internal circuit breaker.",
              rounds: debate.rounds,
              is_mock: debate.is_mock
            }),
          });
          return;
        }

        finalRawDraft = debate.finalDraft;
        totalRounds = debate.rounds;
        stopReason = debate.stopReason;
        leadConfidenceHistory = debate.leadConfidenceHistory;
        criticFlagged = debate.critic_flagged;
        isMockExecution = isMockExecution || debate.is_mock;
      }

      // Step 3: Response Architect Editorial Polish
      await stream.writeSSE({
        event: "thinking",
        data: JSON.stringify({
          stage: "response_architect",
          message: "Response Architect structuring and polishing final response...",
          is_mock: isMockMode(),
        }),
      });

      const formattedOutput = await runResponseArchitect(finalRawDraft, toneInstruction);

      // Step 5: Safety Guardrail Pass
      await stream.writeSSE({
        event: "thinking",
        data: JSON.stringify({
          stage: "safety_guardrail",
          message: "Safety Guardrail verifying final output...",
          is_mock: isMockMode(),
        }),
      });

      const safety = await runSafetyCheck(formattedOutput);

      // In-Memory Backup Session Store
      saveQuerySession({
        queryId,
        query,
        finalDraft: formattedOutput,
        leadDraft: finalRawDraft,
        timestamp: Date.now(),
      });

      // Persistent PostgreSQL Telemetry Logging
      const durationMs = Date.now() - startTime;
      logQueryTelemetry(
        {
          id: queryId,
          queryText: query,
          domain: supervisorPrimaryDomain,
          emotion: supervisorEmotion,
          finalAnswer: formattedOutput,
          totalRounds,
          stopReason,
          criticFlagged,
          isMock: isMockExecution,
        },
        [
          {
            role: "lead",
            modelUsed: customLeadModel || "openai/gpt-oss-120b",
            roundNumber: totalRounds,
            confidence: leadConfidenceHistory[leadConfidenceHistory.length - 1] || 1.0,
            durationMs,
          }
        ]
      ).catch((err) => console.error("Async postgres telemetry log error:", err));

      // Final SSE Message Event
      await stream.writeSSE({
        event: "message",
        data: JSON.stringify({
          queryId,
          content: formattedOutput,
          rounds: totalRounds,
          stopReason,
          leadConfidenceHistory,
          domain: supervisorPrimaryDomain,
          domains: qualifyingDomains,
          emotion: supervisorEmotion,
          critic_flagged: criticFlagged,
          safety: { is_safe: safety.is_safe, category: safety.category },
          is_mock: isMockExecution,
        }),
      });
    });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to process stream" }, 500);
  }
});

// User Counter-Argument Evaluation Endpoint
app.post("/api/chat/argue", async (c) => {
  try {
    const body = await c.req.json();
    const { originalQueryId, targetAgent, userArgument } = body;

    if (!originalQueryId || !targetAgent || !userArgument) {
      return c.json({ 
        error: "Missing required fields: originalQueryId, targetAgent ('lead'|'reviewer'|'critic'), and userArgument are required." 
      }, 400);
    }

    // 1. Try fetching from Postgres DB first, fallback to in-memory session cache
    let sessionQueryText = "";
    let sessionFinalDraft = "";

    const dbQuery = await getPersistedQuery(originalQueryId);
    if (dbQuery) {
      sessionQueryText = dbQuery.queryText;
      sessionFinalDraft = dbQuery.finalAnswer;
    } else {
      const memSession = getQuerySession(originalQueryId);
      if (memSession) {
        sessionQueryText = memSession.query;
        sessionFinalDraft = memSession.finalDraft;
      }
    }

    if (!sessionQueryText) {
      return c.json({ 
        error: `Query session '${originalQueryId}' not found in database or memory. Context is required to evaluate arguments.` 
      }, 404);
    }

    const ruling = await runArgumentRuling(
      sessionQueryText,
      sessionFinalDraft,
      targetAgent as "lead" | "reviewer" | "critic",
      userArgument
    );

    return c.json({
      originalQueryId,
      targetAgent,
      ruling: {
        verdict: ruling.verdict,
        explanation: ruling.explanation,
        updatedAnswer: ruling.updatedAnswer || null,
      },
      is_mock: isMockMode(),
    });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to process argument ruling" }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

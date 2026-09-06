import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { isMockMode } from "./lib/groq.js";
import { GROQ_MODELS } from "./config/models.js";
import { runSupervisor } from "./pipeline/supervisor.js";
import { runDebateLoop } from "./pipeline/loop.js";
import { runLead } from "./pipeline/draft.js";
import { mergeTeamOutputs } from "./pipeline/compiler.js";
import { runResponseArchitect } from "./pipeline/responseArchitect.js";
import { runSafetyCheck } from "./pipeline/safety.js";
import { runArgumentRuling } from "./pipeline/argue.js";
import { saveQuerySession, getQuerySession } from "./lib/queryStore.js";
import { performResearch } from "./lib/research.js";
import { initDb } from "./db/index.js";
import { logQueryTelemetry, getPersistedQuery } from "./db/telemetryRepo.js";
import { randomUUID } from "node:crypto";
import { v2Router } from "./routes/v2.js";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");
import { Readable, PassThrough } from "node:stream";

// -------------------------------------------------------------
// Strict Startup Environment & Secrets Hygiene Check
// -------------------------------------------------------------
function verifyEnvironment() {
  const missingVars: string[] = [];
  if (!process.env.GEMINI_API_KEY) missingVars.push("GEMINI_API_KEY");

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

app.route("/api/v2", v2Router);

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-user-groq-key", "x-user-openai-key", "x-user-anthropic-key"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400,
  })
);

// -------------------------------------------------------------
// Basic IP-based Token Bucket Rate Limiting Middleware
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

// In-Memory Project Workspace Mock Cache (Until Phase 5 DB Workspace integration)
interface ProjectWorkspace {
  id: string;
  name: string;
  files: { filename: string; content: string }[];
  cache: Map<string, any>;
}

export const projectStore = new Map<string, ProjectWorkspace>();

// Initialize default mock projects
projectStore.set("proj-default", {
  id: "proj-default",
  name: "Council Workspace",
  files: [
    { filename: "workspace.ts", content: "// The Council Workspace Artifacts\nexport const version = '1.0.0';\n" },
    { filename: "README.md", content: "# The Council Project\nMulti-agent cognitive consensus workspace.\n" }
  ],
  cache: new Map<string, any>([["transient_token", "temp_val_9942"], ["ast_index", { tree: "cached" }]])
});

projectStore.set("proj-123", {
  id: "proj-123",
  name: "Algorithms Research",
  files: [
    { filename: "sorting.py", content: "def quicksort(arr):\n    return sorted(arr)\n" },
    { filename: "notes.md", content: "# Quicksort Performance Notes\n- Worst case: O(n^2)\n- Average: O(n log n)\n" }
  ],
  cache: new Map<string, any>([["transient_token", "temp_val_9942"], ["ast_index", { tree: "cached" }]])
});

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

app.get("/api/test-groq", async (c) => {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
    });
    const text = await res.text();
    return c.json({ status: res.status, ok: res.ok, data: text });
  } catch (err: any) {
    return c.json({ 
      error: err.message, 
      cause: err.cause ? String(err.cause) : null,
      code: err.code || null,
      name: err.name,
      stack: err.stack
    }, 500);
  }
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

    // Step 1: User Groq Key Override Check
    const userGroqKey = c.req.header("x-user-groq-key")?.trim();

    const body = await c.req.json();
    const query = body.query;
    const manualAgents = (body.manualAgents || body.manualTeam) as string[] | undefined;
    const debateMode: "fast" | "deep" = body.debateMode === "fast" ? "fast" : "deep";
    const requestedMaxRounds = typeof body.maxRounds === "number" ? Math.min(5, Math.max(1, body.maxRounds)) : 5;

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
    const routingMode: "auto" | "manual" = (manualAgents && manualAgents.length > 0) ? "manual" : "auto";

    return streamSSE(c, async (stream) => {
      try {
        let qualifyingDomains: { domain: string; score: number; model?: string }[] = [];
        let toneInstruction = "Provide a clear, direct answer.";
        let supervisorEmotion: any = "neutral";
        let supervisorPrimaryDomain: string = "general";
        let isMockExecution = isMockMode();

        // FAST MODE OVERRIDE (Skip Reviewer/Critic, single Lead call -> Response Architect)
        if (debateMode === "fast") {
          await stream.writeSSE({
            event: "thinking",
            data: JSON.stringify({
              stage: "fast_mode_direct_answer",
              message: "Fast Mode active. Bypassing deliberation loop and running direct Lead synthesis...",
              is_mock: isMockMode(),
            }),
          });

          const leadModel = manualAgents?.[0] ? ((GROQ_MODELS as any)[manualAgents[0]] || manualAgents[0]) : undefined;
          const leadDraft = await runLead(query, undefined, toneInstruction, undefined, leadModel, userGroqKey);
          
          await stream.writeSSE({
            event: "thinking",
            data: JSON.stringify({
              stage: "response_architect",
              message: "Response Architect structuring fast response...",
              is_mock: isMockMode(),
            }),
          });

          const archResult = await runResponseArchitect({
            finalDraft: leadDraft.content,
            query,
            toneInstruction,
            hasLiveSources: false,
            criticFlagged: false,
            rounds: 1,
            confidenceScore: leadDraft.confidence,
            userGroqKey,
          });
          const safety = await runSafetyCheck(archResult.formattedContent, userGroqKey);

          await stream.writeSSE({
            event: "message",
            data: JSON.stringify({
              queryId,
              content: archResult.formattedContent,
              rounds: 1,
              stopReason: "fast_mode_direct",
              leadConfidenceHistory: [leadDraft.confidence],
              domain: "general",
              domains: [{ domain: "general", score: 1.0 }],
              emotion: "neutral",
              routingMode,
              disagreement: archResult.disagreement,
              hasLiveSource: archResult.hasLiveSource,
              critic_flagged: false,
              safety: { is_safe: safety.is_safe, category: safety.category },
              is_mock: isMockExecution,
            }),
          });
          return;
        }

        // DEEP MODE:
        // 1. MANUAL AGENTS ROUTING (SKIPS Supervisor completely BEFORE runSupervisor is called)
        if (routingMode === "manual" && manualAgents && manualAgents.length > 0) {
          await stream.writeSSE({
            event: "thinking",
            data: JSON.stringify({
              stage: "manual_agent_selection",
              message: `Manual agents selected: [${manualAgents.join(", ")}]. Skipping Supervisor classification entirely.`,
              manualAgents,
              routingMode: "manual",
              is_mock: isMockMode(),
            }),
          });

          supervisorPrimaryDomain = manualAgents[0];
          qualifyingDomains = manualAgents.map((domain) => {
            const model = (GROQ_MODELS as any)[domain] || domain;
            return { domain, score: 1.0, model };
          });
        } else {
          // AUTO ROUTING: Invoke Supervisor
          await stream.writeSSE({
            event: "thinking",
            data: JSON.stringify({
              stage: "supervisor",
              message: "Supervisor analyzing query domain and emotional state...",
              routingMode: "auto",
              is_mock: isMockMode(),
            }),
          });

          const supervisor = await runSupervisor(query, userGroqKey);
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
              routingMode: "auto",
              is_mock: supervisor.is_mock,
            }),
          });

          const multiDomains = (supervisor.domains || []).filter((d) => d.score >= 0.75 && d.domain !== "general");
          qualifyingDomains = multiDomains.length >= 2 ? multiDomains : [{ domain: supervisor.domain, score: 1.0 }];
        }

        let finalRawDraft = "";
        let totalRounds = 0;
        let stopReason: any = "approved";
        let leadConfidenceHistory: number[] = [];
        let criticFlagged = false;

        let researchContext = "";
        let researchSources: { title: string; url: string }[] = [];
        let detectedResearchProvider: "tavily" | "gemini" | undefined = undefined;

        // STEP 5: Live Web Research Phase for Research Domain
        const hasResearchDomain = qualifyingDomains.some((d) => d.domain === "research");
        if (hasResearchDomain) {
          await stream.writeSSE({
            event: "thinking",
            data: JSON.stringify({
              stage: "researching",
              message: "Initiating live grounded web research across authoritative sources...",
              is_mock: isMockMode(),
            }),
          });

          const researchRes = await performResearch(query);
          detectedResearchProvider = researchRes.provider;

          if (researchRes.success && researchRes.results.length > 0) {
            researchSources = researchRes.results.map((r) => ({ title: r.title, url: r.url }));
            researchContext = `\n--- GROUNDED LIVE WEB RESEARCH RESULTS (Provider: ${researchRes.provider.toUpperCase()}) ---\n` +
              researchRes.results.map((r, i) => `[${i + 1}] ${r.title} (${r.url}):\n${r.content}`).join("\n\n");

            await stream.writeSSE({
              event: "thinking",
              data: JSON.stringify({
                stage: "research_complete",
                message: `Grounded web research completed successfully via ${researchRes.provider.toUpperCase()}. Extracted ${researchRes.results.length} sources.`,
                provider: researchRes.provider,
                sources: researchSources,
                is_mock: isMockMode(),
              }),
            });
          }
        }

        let disputeObjection = "";
        let disputeCritique = "";

        if (qualifyingDomains.length >= 2) {
          // Multi-Team Parallel Execution (Handles both 2+ auto-detected domains and 2+ manualAgents)
          await stream.writeSSE({
            event: "thinking",
            data: JSON.stringify({
              stage: "multi_team_start",
              message: `Running ${qualifyingDomains.length} parallel specialized teams: ${qualifyingDomains.map(d => d.domain).join(", ")}...`,
              domains: qualifyingDomains,
              routingMode,
              is_mock: isMockMode(),
            }),
          });

          const teamResults = await Promise.all(
            qualifyingDomains.map(async (d) => {
              const domainTone = `${toneInstruction} (Focus explicitly on the ${d.domain} domain facet)`;
              const teamModel = d.model || (GROQ_MODELS as any)[d.domain] || GROQ_MODELS.lead;
              const teamHelperContext = d.domain === "research" ? researchContext : undefined;
              const res = await runDebateLoop(
                query, 
                domainTone, 
                async (progress) => {
                  await stream.writeSSE({
                    event: "thinking",
                    data: JSON.stringify({ ...progress, team_domain: d.domain, is_mock: isMockMode() }),
                  });
                },
                {
                  leadModel: teamModel,
                  maxRounds: requestedMaxRounds,
                  userGroqKey,
                  helperContext: teamHelperContext,
                }
              );
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
          disputeObjection = teamResults.map(t => t.result.criticObjection).filter(Boolean).join(" | ");
          disputeCritique = teamResults.map(t => t.result.previousCritiqueSummary).filter(Boolean).join(" | ");

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

          finalRawDraft = await mergeTeamOutputs(query, teamResults, userGroqKey);
        } else {
          // Single Team Execution (Auto single domain or 1 manual agent)
          const singleDomainObj = qualifyingDomains[0];
          const singleLeadModel = singleDomainObj?.model || (GROQ_MODELS as any)[singleDomainObj?.domain] || GROQ_MODELS.lead;

          await stream.writeSSE({
            event: "thinking",
            data: JSON.stringify({
              stage: "debate_start",
              message: `Starting Lead (${singleDomainObj?.domain || "general"}), Reviewer, and Critic deliberation loop...`,
              routingMode,
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
              leadModel: singleLeadModel,
              maxRounds: requestedMaxRounds,
              userGroqKey,
              helperContext: singleDomainObj?.domain === "research" ? researchContext : undefined,
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
          disputeObjection = debate.criticObjection || "";
          disputeCritique = debate.previousCritiqueSummary || "";
          isMockExecution = isMockExecution || debate.is_mock;
        }

        // Response Architect Editorial Polish
        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({
            stage: "response_architect",
            message: "Response Architect structuring and polishing final response...",
            is_mock: isMockMode(),
          }),
        });

        const archResult = await runResponseArchitect({
          finalDraft: finalRawDraft,
          query,
          toneInstruction,
          hasLiveSources: researchSources.length > 0,
          criticFlagged,
          rounds: totalRounds,
          criticObjection: disputeObjection,
          critiqueSummary: disputeCritique,
          confidenceScore: leadConfidenceHistory[leadConfidenceHistory.length - 1],
          userGroqKey,
        });

        const formattedOutput = archResult.formattedContent;

        // Safety Guardrail Pass
        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({
            stage: "safety_guardrail",
            message: "Safety Guardrail verifying final output...",
            is_mock: isMockMode(),
          }),
        });

        const safety = await runSafetyCheck(formattedOutput, userGroqKey);

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
            routingMode,
            researchProvider: detectedResearchProvider || null,
            isMock: isMockExecution,
          },
          [
            {
              role: "lead",
              modelUsed: qualifyingDomains[0]?.model || "openai/gpt-oss-120b",
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
            routingMode,
            disagreement: archResult.disagreement,
            hasLiveSource: archResult.hasLiveSource,
            researchProvider: detectedResearchProvider || null,
            sources: researchSources,
            critic_flagged: criticFlagged,
            safety: { is_safe: safety.is_safe, category: safety.category },
            is_mock: isMockExecution,
          }),
        });
      } catch (streamErr: any) {
        if (streamErr.message?.includes("Invalid Groq API key provided")) {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({
              error: "Invalid Groq API key provided",
              message: "Your custom Groq API key was rejected by the provider. Please check your key in settings."
            }),
          });
        } else {
          await stream.writeSSE({
            event: "error",
            data: JSON.stringify({ error: streamErr.message || "Pipeline error" }),
          });
        }
      }
    });
  } catch (error: any) {
    if (error.message?.includes("Invalid Groq API key provided")) {
      return c.json({ error: "Invalid Groq API key provided" }, 400);
    }
    return c.json({ error: error.message || "Failed to process stream" }, 500);
  }
});

// User Counter-Argument Evaluation Endpoint
app.post("/api/chat/argue", async (c) => {
  try {
    const userGroqKey = c.req.header("x-user-groq-key")?.trim();
    const body = await c.req.json();
    const { originalQueryId, targetAgent, userArgument } = body;

    if (!originalQueryId || !targetAgent || !userArgument) {
      return c.json({ 
        error: "Missing required fields: originalQueryId, targetAgent ('lead'|'reviewer'|'critic'), and userArgument are required." 
      }, 400);
    }

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
      userArgument,
      userGroqKey
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
    if (error.message?.includes("Invalid Groq API key provided")) {
      return c.json({ error: "Invalid Groq API key provided" }, 400);
    }
    return c.json({ error: error.message || "Failed to process argument ruling" }, 500);
  }
});

// -------------------------------------------------------------
// STEP 3: Workspace Export as .zip Endpoint
// -------------------------------------------------------------
app.get("/api/project/:projectId/export", async (c) => {
  const projectId = c.req.param("projectId");
  const project = projectStore.get(projectId);

  if (!project) {
    return c.json({ error: `Project '${projectId}' not found` }, 404);
  }

  const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", (err: any) => reject(err));

    for (const file of project.files) {
      archive.append(file.content, { name: file.filename });
    }

    // Include project metadata summary
    archive.append(
      JSON.stringify({ projectId: project.id, projectName: project.name, exportedAt: new Date().toISOString() }, null, 2),
      { name: "project-meta.json" }
    );

    archive.finalize();
  });

  return c.body(new Uint8Array(zipBuffer), 200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${project.name.toLowerCase().replace(/\s+/g, "_")}_export.zip"`,
  });
});

// -------------------------------------------------------------
// STEP 4: Clear Workspace Transient Cache Endpoint
// -------------------------------------------------------------
app.delete("/api/project/:projectId/cache", (c) => {
  const projectId = c.req.param("projectId");
  const project = projectStore.get(projectId);

  if (!project) {
    return c.json({ error: `Project '${projectId}' not found` }, 404);
  }

  const clearedKeysCount = project.cache.size;
  project.cache.clear();

  return c.json({
    status: "ok",
    projectId,
    message: `Transient cache cleared successfully. Cleared ${clearedKeysCount} cached session artifacts/ASTs. (Persisted files and database history retained).`,
    clearedKeysCount,
  });
});

const port = Number(process.env.PORT) || 3000;
if (process.env.NODE_ENV !== "test") {
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export { app };

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { runSkeptic } from "../agents/skeptic.js";
import { runVisionary } from "../agents/visionary.js";
import { runEngineer } from "../agents/engineer.js";
import { runSynthesizer } from "../agents/synthesizer.js";
import { runDebateProtocol } from "../pipeline/debate.js";
import { runPipelineVerifier } from "../pipeline/verifier.js";
import { PipelineWatchdog } from "../pipeline/watchdog.js";
import { TelemetryEmitter } from "../telemetry/stream.js";
import { createSession, getSession, addMessage, getSessionContext } from "../memory/session.js";
import { saveEpisode, searchEpisodes } from "../memory/episodic.js";
import { getMemoryContext, runSleepPhaseCompression } from "../memory/compression.js";
import { isGeminiConfigured } from "../lib/gemini.js";
import { randomUUID } from "node:crypto";

export const v2Router = new Hono();

// ── Health Check ──────────────────────────────────────────────────
v2Router.get("/health", (c) => c.json({
  version: "2.0",
  engine: "Google Gemini 1.5 Flash — Heterogeneous Ensemble",
  geminiConfigured: isGeminiConfigured(),
  features: [
    "4-agent Flash ensemble (temp diversity: 0.1 / 0.2 / 0.5 / 0.9)",
    "Structured Agent Protocol (SAP) — typed JSON inter-agent communication",
    "Cascade Hallucination Prevention — Verifier Node",
    "Circuit Breaker + Dead-Loop Watchdog",
    "Live Observability Telemetry (SSE)",
    "Graceful Degradation Mode",
    "Adversarial Debate Protocol",
    "3-Layer Memory: Session + Episodic + Sleep-Phase Compression",
    "Cognitive Budget Allocation",
  ],
}));

// ── Live Telemetry Stream (GET) ───────────────────────────────────
v2Router.get("/telemetry/:queryId", (c) => {
  // This is a stub — in production wire to a pub/sub or in-memory event bus
  return c.json({ message: "Telemetry streaming available via /chat/stream SSE events", queryId: c.req.param("queryId") });
});

// ── Main V2 Chat Endpoint ─────────────────────────────────────────
v2Router.post("/chat/stream", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const {
    query,
    sessionId: reqSessionId,
    debateRounds = 1,
    tokenBudget = 20000,
  } = body;

  if (!query) return c.json({ error: "Missing 'query' field" }, 400);
  if (query.length > 4000) return c.json({ error: "Query too long (max 4000 chars)" }, 400);
  if (!isGeminiConfigured()) return c.json({ error: "GEMINI_API_KEY not configured on server" }, 503);

  const queryId = randomUUID();
  const sessionId = reqSessionId || randomUUID();
  if (!getSession(sessionId)) createSession(sessionId);

  return streamSSE(c, async (stream) => {

    // ── Setup: Watchdog + Telemetry ──────────────────────────────
    const watchdog = new PipelineWatchdog(queryId, { maxTokenBudget: tokenBudget });
    const telemetry = new TelemetryEmitter(queryId, async (event) => {
      await stream.writeSSE({
        event: "telemetry",
        data: JSON.stringify(event),
      });
    });

    try {
      await telemetry.pipelineStart(query, false);

      // ── Stage 0: Memory Retrieval ────────────────────────────
      await telemetry.stageBegin("memory");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "memory", message: "🧠 Retrieving memory context..." }) });

      const [sessionCtx, episodicResults, longTermCtx] = await Promise.all([
        Promise.resolve(getSessionContext(sessionId)),
        searchEpisodes(query).catch(() => []),
        getMemoryContext().catch(() => ""),
      ]);

      if (episodicResults.length > 0) {
        await telemetry.memoryHit(["session", "episodic", "long-term"], episodicResults.length);
      }
      await telemetry.stageEnd("memory");

      const memCtxParts = [
        sessionCtx ? `Recent conversation:\n${sessionCtx}` : "",
        episodicResults.length > 0 ? `Relevant past:\n${episodicResults.map(e => e.summary).join("\n")}` : "",
        longTermCtx ? `Long-term memory:\n${longTermCtx}` : "",
      ].filter(Boolean);

      const memoryContext = memCtxParts.join("\n\n");
      const enrichedQuery = memoryContext
        ? `[MEMORY CONTEXT]\n${memoryContext}\n\n[QUERY]\n${query}`
        : query;

      // ── Stage 1: Cognitive Budget Routing ────────────────────
      await telemetry.stageBegin("supervisor");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "supervisor", message: "🎯 Supervisor classifying query complexity..." }) });

      const isComplex = query.split(" ").length > 12 ||
        /\b(why|how|analyze|compare|explain|design|build|strategy|best|difference|implement|evaluate|review)\b/i.test(query);

      await telemetry.stageEnd("supervisor");

      // ── Stage 2: Flash Ensemble (Parallel) ───────────────────
      await telemetry.stageBegin("agents");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({
        type: "stage", stage: "agents",
        message: isComplex
          ? "⚡ Full ensemble: Skeptic (0.1) + Visionary (0.9) + Engineer (0.2) activated in parallel..."
          : "⚡ Budget mode: Engineer (0.2) activated...",
        isComplex,
      }) });

      let agentOutputs;
      if (isComplex) {
        await telemetry.agentStart("Skeptic", 0.1);
        await telemetry.agentStart("Visionary", 0.9);
        await telemetry.agentStart("Engineer", 0.2);

        const [skeptic, visionary, engineer] = await Promise.all([
          runSkeptic(enrichedQuery),
          runVisionary(enrichedQuery),
          runEngineer(enrichedQuery),
        ]);

        agentOutputs = [skeptic, visionary, engineer];
        for (const a of agentOutputs) {
          await telemetry.agentEnd(a.agent, a.confidence);
          watchdog.recordTokens(Math.ceil(a.output.length / 4));
        }
      } else {
        await telemetry.agentStart("Engineer", 0.2);
        const engineer = await runEngineer(enrichedQuery);
        agentOutputs = [engineer];
        await telemetry.agentEnd(engineer.agent, engineer.confidence);
        watchdog.recordTokens(Math.ceil(engineer.output.length / 4));
      }

      // ── Watchdog Check after agents ──
      const watchdogCheck = watchdog.check();
      await telemetry.watchdogCheck(watchdogCheck.stats, !watchdogCheck.allowed, watchdogCheck.reason);
      if (!watchdogCheck.allowed) {
        await telemetry.circuitBreakerTripped(watchdogCheck.reason!);
        await stream.writeSSE({ event: "error", data: JSON.stringify({
          type: "circuit_breaker",
          message: `Pipeline halted: ${watchdogCheck.reason}`,
          partialAgents: agentOutputs.length,
        }) });
        return;
      }

      // ── Stage 3: Verification (Cascade Hallucination Prevention) ──
      await telemetry.stageBegin("verification");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "verification", message: "🔍 Verifier Node checking agent outputs for cascade risks..." }) });

      const verdict = runPipelineVerifier(agentOutputs, { minPassingAgents: 1 });

      for (const result of verdict.results) {
        await telemetry.verificationResult(result.agent, result.passed, result.reason);
        await stream.writeSSE({ event: "verification", data: JSON.stringify({
          type: "verification",
          agent: result.agent,
          passed: result.passed,
          confidence: result.confidence,
          reason: result.reason,
        }) });
      }

      if (verdict.halted) {
        await stream.writeSSE({ event: "error", data: JSON.stringify({
          type: "verification_halt",
          message: verdict.haltReason,
        }) });
        return;
      }

      // Use only verified safe outputs. If some failed → degraded mode.
      let finalAgentOutputs = verdict.safeOutputs;
      const isDegraded = !verdict.allPassed;
      if (isDegraded) {
        const missing = agentOutputs.filter(a => !verdict.safeOutputs.find(s => s.agent === a.agent)).map(a => a.agent);
        await telemetry.degradedMode(verdict.safeOutputs.map(a => a.agent), missing);
        await stream.writeSSE({ event: "degraded", data: JSON.stringify({
          type: "degraded_mode",
          message: `⚠️ Running in degraded mode. ${missing.join(", ")} failed verification.`,
          activeAgents: verdict.safeOutputs.map(a => a.agent),
          missingAgents: missing,
        }) });
      }

      await telemetry.stageEnd("verification");

      // Stream agent outputs to frontend
      for (const agent of finalAgentOutputs) {
        await stream.writeSSE({ event: "agent_output", data: JSON.stringify({
          type: "agent_output", agent: agent.agent, output: agent.output,
          confidence: agent.confidence, temperature: agent.temperature,
        }) });
      }

      // ── Stage 4: Adversarial Debate (complex + multi-agent) ──
      if (isComplex && debateRounds > 0 && finalAgentOutputs.length >= 2) {
        const debateCheck = watchdog.recordRound();
        if (debateCheck.allowed) {
          await telemetry.stageBegin("debate");
          await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "debate", message: "⚔️ Adversarial debate protocol initiated..." }) });

          const debateResult = await runDebateProtocol(query, finalAgentOutputs, Math.min(debateRounds, 2));
          finalAgentOutputs = debateResult.finalOutputs;

          for (const round of debateResult.rounds) {
            await telemetry.debateRound(round.round, "Skeptic", "Engineer");
            await stream.writeSSE({ event: "debate_round", data: JSON.stringify({ type: "debate_round", ...round }) });
          }
          await telemetry.stageEnd("debate");
        } else {
          await telemetry.circuitBreakerTripped(debateCheck.reason!);
          await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "debate", message: "⚡ Debate skipped — watchdog budget reached." }) });
        }
      }

      // ── Stage 5: Synthesis ──────────────────────────────────
      await telemetry.stageBegin("synthesis");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "synthesis", message: "🔮 Synthesizer integrating with confidence weighting..." }) });

      const synthesis = await runSynthesizer(query, finalAgentOutputs);
      watchdog.recordTokens(Math.ceil(synthesis.finalAnswer.length / 4));
      await telemetry.stageEnd("synthesis", Math.ceil(synthesis.finalAnswer.length / 4));

      // ── Final Response ────────────────────────────────────────
      const finalStats = watchdog.getStats();
      await stream.writeSSE({ event: "final", data: JSON.stringify({
        type: "final",
        sessionId,
        queryId,
        answer: synthesis.finalAnswer,
        confidence: synthesis.overallConfidence,
        consensus: synthesis.consensus,
        dissentReport: synthesis.dissentReport,
        memoryUsed: !!memoryContext,
        degradedMode: isDegraded,
        agentCount: finalAgentOutputs.length,
        agents: finalAgentOutputs.map(a => ({ name: a.agent, confidence: a.confidence, temperature: a.temperature })),
        pipeline: {
          totalTokensEstimated: finalStats.totalTokens,
          totalElapsedMs: finalStats.elapsedMs,
          roundCount: finalStats.roundCount,
          watchdogTripped: finalStats.isTripped,
        },
        version: "2.0",
      }) });

      await telemetry.pipelineEnd(true, finalStats.totalTokens, synthesis.overallConfidence);

      // ── Background: Memory Persistence ───────────────────────
      addMessage(sessionId, { role: "user", content: query, timestamp: Date.now() });
      addMessage(sessionId, {
        role: "assistant",
        content: synthesis.finalAnswer,
        timestamp: Date.now(),
        agents: finalAgentOutputs.map(a => a.agent),
      });

      saveEpisode({
        timestamp: Date.now(),
        query: query.slice(0, 200),
        summary: synthesis.finalAnswer.slice(0, 200),
        agents: finalAgentOutputs.map(a => a.agent),
        confidence: synthesis.overallConfidence,
      }).then(() => runSleepPhaseCompression()).catch(console.error);

    } catch (err: any) {
      await telemetry.pipelineEnd(false);
      await stream.writeSSE({ event: "error", data: JSON.stringify({
        type: "error",
        message: err?.message || "V2 pipeline failed unexpectedly",
        queryId,
      }) });
    }
  });
});

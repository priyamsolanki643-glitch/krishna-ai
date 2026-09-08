import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

// Agents
import { runSkeptic } from "../agents/skeptic.js";
import { runVisionary } from "../agents/visionary.js";
import { runEngineer } from "../agents/engineer.js";
import { runSynthesizer } from "../agents/synthesizer.js";
import type { AgentResult } from "../agents/skeptic.js";

// Pipeline
import { runDebateProtocol } from "../pipeline/debate.js";
import { runPipelineVerifier } from "../pipeline/verifier.js";
import { PipelineWatchdog } from "../pipeline/watchdog.js";

// Concept 1: ADAS — Self-Designing Pipeline
import { runArchitect } from "../meta/architect.js";
import type { AgentName, PipelineDAG } from "../meta/architect.js";

// Concept 2: Self-Play
import { startSelfPlayScheduler, getLearnedStrategiesForDomain } from "../selfplay/runner.js";

// Concept 3: Epistemic State
import { parseEpistemicMarkers, buildEpistemicContext } from "../epistemic/state.js";

// Telemetry + Memory
import { TelemetryEmitter } from "../telemetry/stream.js";
import { createSession, getSession, addMessage, getSessionContext } from "../memory/session.js";
import { saveEpisode, searchEpisodes } from "../memory/episodic.js";
import { getMemoryContext, runSleepPhaseCompression } from "../memory/compression.js";
import { isGeminiConfigured } from "../lib/gemini.js";
import { randomUUID } from "node:crypto";

export const v2Router = new Hono();

// Start self-play scheduler on boot
startSelfPlayScheduler();

// ── Agent execution map ──────────────────────────────────────────
async function executeAgent(name: AgentName, query: string): Promise<AgentResult | null> {
  try {
    switch (name) {
      case "skeptic":     return await runSkeptic(query);
      case "engineer":    return await runEngineer(query);
      case "visionary":   return await runVisionary(query);
      case "synthesizer": return null; // Synthesizer runs separately
      default:            return null;
    }
  } catch (err) {
    console.error(`[Agent] ${name} failed:`, err);
    return null;
  }
}

// ── Health Check ──────────────────────────────────────────────────
v2Router.get("/health", (c) => c.json({
  version: "2.1",
  engine: "Google Gemini Flash — Heterogeneous Ensemble",
  geminiConfigured: isGeminiConfigured(),
  innovations: [
    "ADAS: Automated Design of Agentic Systems (NeurIPS 2026)",
    "Self-Play: Synthetic self-improvement without human data (Meta Research)",
    "Epistemic State Sharing: Claim-level uncertainty mapping (ICLR 2026)",
  ],
  productionSystems: [
    "Structured Agent Protocol (SAP)",
    "Cascade Hallucination Prevention",
    "Circuit Breaker + Loop Watchdog",
    "Live Observability Telemetry",
    "Graceful Degradation Mode",
    "3-Layer Memory (Session + Episodic + Sleep-Phase)",
  ],
}));

// ── Self-Play Status ──────────────────────────────────────────────
v2Router.get("/selfplay/status", async (c) => {
  const { loadStrategies } = await import("../selfplay/runner.js") as any;
  try {
    const strategies = typeof loadStrategies === "function" ? await loadStrategies() : [];
    return c.json({ schedulerActive: true, learnedStrategies: strategies.length });
  } catch {
    return c.json({ schedulerActive: true, learnedStrategies: 0 });
  }
});

// ── Trigger Manual Self-Play Round ───────────────────────────────
v2Router.post("/selfplay/run", async (c) => {
  const { runSelfPlayCycle } = await import("../selfplay/runner.js");
  const body = await c.req.json().catch(() => ({ rounds: 3 }));
  const results = await runSelfPlayCycle(Math.min(body.rounds ?? 3, 5));
  return c.json({
    rounds: results.length,
    avgScore: results.reduce((s, r) => s + r.finalScore, 0) / Math.max(results.length, 1),
    learnedStrategies: results.filter(r => r.learnedStrategy).length,
  });
});

// ── Main V2 Chat Endpoint ─────────────────────────────────────────
v2Router.post("/chat/stream", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { query, sessionId: reqSessionId, tokenBudget = 25000 } = body;

  if (!query) return c.json({ error: "Missing 'query' field" }, 400);
  if (query.length > 4000) return c.json({ error: "Query too long (max 4000 chars)" }, 400);
  if (!isGeminiConfigured()) return c.json({ error: "GEMINI_API_KEY not configured" }, 503);

  const queryId = randomUUID();
  const sessionId = reqSessionId || randomUUID();
  if (!getSession(sessionId)) createSession(sessionId);

  return streamSSE(c, async (stream) => {
    const watchdog = new PipelineWatchdog(queryId, { maxTokenBudget: tokenBudget });
    const telemetry = new TelemetryEmitter(queryId, async (event) => {
      await stream.writeSSE({ event: "telemetry", data: JSON.stringify(event) });
    });

    try {
      await telemetry.pipelineStart(query, true);

      // ── Stage 0: Memory + Learned Strategies ────────────────
      await telemetry.stageBegin("memory");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ stage: "memory", message: "🧠 Loading memory + learned strategies..." }) });

      const [sessionCtx, episodicResults, longTermCtx] = await Promise.all([
        Promise.resolve(getSessionContext(sessionId)),
        searchEpisodes(query).catch(() => []),
        getMemoryContext().catch(() => ""),
      ]);

      // Inject self-play learned strategies into context
      const learnedStrategies = await getLearnedStrategiesForDomain(query.split(" ").slice(0, 3).join(" ")).catch(() => []);

      const memParts = [
        sessionCtx ? `Recent conversation:\n${sessionCtx}` : "",
        episodicResults.length > 0 ? `Relevant past:\n${episodicResults.map(e => e.summary).join("\n")}` : "",
        longTermCtx ? `Long-term memory:\n${longTermCtx}` : "",
        learnedStrategies.length > 0 ? `Learned strategies from self-play:\n${learnedStrategies.join("\n")}` : "",
      ].filter(Boolean);

      const memoryContext = memParts.join("\n\n");
      const enrichedQuery = memoryContext ? `[CONTEXT]\n${memoryContext}\n\n[QUERY]\n${query}` : query;

      if (episodicResults.length > 0 || learnedStrategies.length > 0) {
        await telemetry.memoryHit(
          ["session", "episodic", "long-term", "self-play-strategies"],
          episodicResults.length + learnedStrategies.length,
        );
      }
      await telemetry.stageEnd("memory");

      // ── Stage 1: ADAS — Architect Designs Pipeline ──────────
      await telemetry.stageBegin("architect");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ stage: "architect", message: "🏗️ Architect designing optimal pipeline for this query..." }) });

      const dag: PipelineDAG = await runArchitect(query);

      await stream.writeSSE({ event: "pipeline_design", data: JSON.stringify({
        type: "pipeline_design",
        queryType: dag.queryType,
        rationale: dag.rationale,
        parallelAgents: dag.parallelAgents,
        sequentialAgents: dag.sequentialAgents,
        debateEnabled: dag.debateEnabled,
        debateRounds: dag.debateRounds,
        complexity: dag.estimatedComplexity,
      }) });
      await telemetry.stageEnd("architect");

      // ── Stage 2: Execute Designed Pipeline ──────────────────
      await telemetry.stageBegin("agents");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({
        stage: "agents",
        message: `⚡ Running ${dag.parallelAgents.join(" + ")} in parallel...`,
        agents: dag.parallelAgents,
      }) });

      // Run parallel agents as specified by Architect
      const agentPromises = dag.parallelAgents
        .filter(name => name !== "synthesizer")
        .map(async (name) => {
          await telemetry.agentStart(name, dag.nodes[name].temperature);
          const result = await executeAgent(name, enrichedQuery);
          if (result) {
            await telemetry.agentEnd(name, result.confidence);
            watchdog.recordTokens(Math.ceil(result.output.length / 4));
          }
          return result;
        });

      const parallelResults = (await Promise.all(agentPromises)).filter(Boolean) as AgentResult[];

      // Run sequential agents (if any)
      let sequentialResults: AgentResult[] = [];
      for (const name of dag.sequentialAgents.filter(n => n !== "synthesizer")) {
        const watchCheck = watchdog.check();
        if (!watchCheck.allowed) {
          await telemetry.circuitBreakerTripped(watchCheck.reason!);
          break;
        }
        await telemetry.agentStart(name, dag.nodes[name].temperature);
        const result = await executeAgent(name, enrichedQuery);
        if (result) {
          await telemetry.agentEnd(name, result.confidence);
          watchdog.recordTokens(Math.ceil(result.output.length / 4));
          sequentialResults.push(result);
        }
      }

      let agentOutputs = [...parallelResults, ...sequentialResults];
      await telemetry.stageEnd("agents");

      // ── Watchdog Check ───────────────────────────────────────
      const watchCheck = watchdog.check();
      if (!watchCheck.allowed) {
        await telemetry.circuitBreakerTripped(watchCheck.reason!);
        await stream.writeSSE({ event: "error", data: JSON.stringify({ type: "circuit_breaker", message: watchCheck.reason }) });
        return;
      }

      // ── Stage 3: Verification ────────────────────────────────
      await telemetry.stageBegin("verification");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ stage: "verification", message: "🔍 Verifier checking for cascade risks..." }) });

      const verdict = runPipelineVerifier(agentOutputs, { minPassingAgents: 1 });
      for (const r of verdict.results) {
        await telemetry.verificationResult(r.agent, r.passed, r.reason);
        await stream.writeSSE({ event: "verification", data: JSON.stringify(r) });
      }

      if (verdict.halted) {
        await stream.writeSSE({ event: "error", data: JSON.stringify({ type: "verification_halt", message: verdict.haltReason }) });
        return;
      }

      let finalAgentOutputs = verdict.safeOutputs;
      const isDegraded = !verdict.allPassed;

      if (isDegraded) {
        const missing = agentOutputs
          .filter(a => !verdict.safeOutputs.find(s => s.agent === a.agent))
          .map(a => a.agent);
        await telemetry.degradedMode(verdict.safeOutputs.map(a => a.agent), missing);
        await stream.writeSSE({ event: "degraded", data: JSON.stringify({ activeAgents: verdict.safeOutputs.map(a => a.agent), missingAgents: missing }) });
      }

      await telemetry.stageEnd("verification");

      // Stream verified agent outputs
      for (const agent of finalAgentOutputs) {
        await stream.writeSSE({ event: "agent_output", data: JSON.stringify({
          type: "agent_output", agent: agent.agent, output: agent.output,
          confidence: agent.confidence, temperature: agent.temperature,
        }) });
      }

      // ── Stage 4: Concept 3 — Epistemic State Mapping ────────
      await telemetry.stageBegin("epistemic");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ stage: "epistemic", message: "🧩 Building epistemic uncertainty maps per agent..." }) });

      const epistemicStates = finalAgentOutputs.map(agent =>
        parseEpistemicMarkers(agent.agent, agent.output, agent.confidence)
      );

      const epistemicContext = buildEpistemicContext(epistemicStates);

      await stream.writeSSE({ event: "epistemic_map", data: JSON.stringify({
        type: "epistemic_map",
        agents: epistemicStates.map(s => ({
          agent: s.agentName,
          overallConfidence: s.overallConfidence,
          highConfidenceClaims: s.highConfidenceClaims.length,
          lowConfidenceClaims: s.lowConfidenceClaims.length,
          knownUnknowns: s.knownUnknowns,
          epistemicGaps: s.epistemicGaps,
        })),
      }) });
      await telemetry.stageEnd("epistemic");

      // ── Stage 5: Debate (if DAG specifies) ──────────────────
      if (dag.debateEnabled && dag.debateRounds > 0 && finalAgentOutputs.length >= 2) {
        const debateCheck = watchdog.recordRound();
        if (debateCheck.allowed) {
          await telemetry.stageBegin("debate");
          await stream.writeSSE({ event: "stage", data: JSON.stringify({ stage: "debate", message: `⚔️ Adversarial debate — ${dag.debateRounds} round(s)...` }) });
          const debateResult = await runDebateProtocol(query, finalAgentOutputs, dag.debateRounds);
          finalAgentOutputs = debateResult.finalOutputs;
          for (const round of debateResult.rounds) {
            await telemetry.debateRound(round.round, "Skeptic", "Engineer");
            await stream.writeSSE({ event: "debate_round", data: JSON.stringify(round) });
          }
          await telemetry.stageEnd("debate");
        }
      }

      // ── Stage 6: Epistemic-Weighted Synthesis ───────────────
      await telemetry.stageBegin("synthesis");
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ stage: "synthesis", message: "🔮 Epistemic-weighted synthesis in progress..." }) });

      // Pass epistemic context to Synthesizer for informed weighting
      const synthesis = await runSynthesizer(
        `${query}\n\n${epistemicContext}`,
        finalAgentOutputs,
      );

      watchdog.recordTokens(Math.ceil(synthesis.finalAnswer.length / 4));
      await telemetry.stageEnd("synthesis");

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
        // ADAS metadata
        pipelineDesign: {
          queryType: dag.queryType,
          rationale: dag.rationale,
          agentsUsed: finalAgentOutputs.map(a => a.agent),
          debateRounds: dag.debateRounds,
          complexity: dag.estimatedComplexity,
        },
        // Epistemic metadata
        epistemicSummary: epistemicStates.map(s => ({
          agent: s.agentName,
          overallConfidence: s.overallConfidence,
          knownUnknowns: s.knownUnknowns,
        })),
        degradedMode: isDegraded,
        memoryUsed: !!memoryContext,
        learnedStrategiesUsed: learnedStrategies.length,
        pipeline: {
          totalTokensEstimated: finalStats.totalTokens,
          totalElapsedMs: finalStats.elapsedMs,
          watchdogTripped: finalStats.isTripped,
        },
        version: "2.1",
      }) });

      await telemetry.pipelineEnd(true, finalStats.totalTokens, synthesis.overallConfidence);

      // ── Background Memory + Self-Play Improvement ────────────
      addMessage(sessionId, { role: "user", content: query, timestamp: Date.now() });
      addMessage(sessionId, { role: "assistant", content: synthesis.finalAnswer, timestamp: Date.now(), agents: finalAgentOutputs.map(a => a.agent) });

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
        message: err?.message || "V2 pipeline failed",
        queryId,
      }) });
    }
  });
});

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { runSkeptic } from "../agents/skeptic.js";
import { runVisionary } from "../agents/visionary.js";
import { runEngineer } from "../agents/engineer.js";
import { runSynthesizer } from "../agents/synthesizer.js";
import { runDebateProtocol } from "../pipeline/debate.js";
import { createSession, getSession, addMessage, getSessionContext } from "../memory/session.js";
import { saveEpisode, searchEpisodes } from "../memory/episodic.js";
import { getMemoryContext, runSleepPhaseCompression } from "../memory/compression.js";
import { isGeminiConfigured } from "../lib/gemini.js";
import { randomUUID } from "node:crypto";

export const v2Router = new Hono();

v2Router.get("/health", (c) => c.json({
  version: "2.0",
  engine: "Google Gemini 1.5 Flash - Heterogeneous Ensemble",
  geminiConfigured: isGeminiConfigured(),
  features: [
    "4-agent Flash ensemble (temp diversity: 0.1/0.2/0.5/0.9)",
    "Adversarial Debate Protocol",
    "Confidence-Weighted Synthesis",
    "Dissent Report (epistemic transparency)",
    "3-Layer Memory: Session + Episodic + Sleep-Phase Compression",
    "Cognitive Budget Allocation (simple vs complex routing)",
  ],
}));

v2Router.post("/chat/stream", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { query, sessionId: reqSessionId, debateRounds = 1 } = body;

  if (!query) return c.json({ error: "Missing 'query' field" }, 400);
  if (query.length > 4000) return c.json({ error: "Query too long (max 4000 chars)" }, 400);
  if (!isGeminiConfigured()) return c.json({ error: "GEMINI_API_KEY not configured on server" }, 503);

  const sessionId = reqSessionId || randomUUID();
  if (!getSession(sessionId)) createSession(sessionId);

  return streamSSE(c, async (stream) => {
    try {
      // ── Stage 0: Memory Retrieval ──
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "memory", message: "🧠 Retrieving memory context..." }) });

      const [sessionCtx, episodicResults, longTermCtx] = await Promise.all([
        Promise.resolve(getSessionContext(sessionId)),
        searchEpisodes(query).catch(() => []),
        getMemoryContext().catch(() => ""),
      ]);

      const memCtxParts = [
        sessionCtx ? `Recent conversation:\n${sessionCtx}` : "",
        episodicResults.length > 0 ? `Relevant past:\n${episodicResults.map(e => e.summary).join("\n")}` : "",
        longTermCtx ? `Long-term memory:\n${longTermCtx}` : "",
      ].filter(Boolean);

      const memoryContext = memCtxParts.join("\n\n");
      const enrichedQuery = memoryContext ? `[MEMORY CONTEXT]\n${memoryContext}\n\n[QUERY]\n${query}` : query;

      // ── Stage 1: Cognitive Budget Classification ──
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "supervisor", message: "🎯 Supervisor classifying query complexity..." }) });

      const isComplex = query.split(" ").length > 12 ||
        /\b(why|how|analyze|compare|explain|design|build|strategy|best|difference|implement|evaluate|review)\b/i.test(query);

      // ── Stage 2: Flash Ensemble (parallel activation) ──
      await stream.writeSSE({ event: "stage", data: JSON.stringify({
        type: "stage", stage: "agents",
        message: isComplex ? "⚡ Full ensemble: Skeptic + Visionary + Engineer activated in parallel..." : "⚡ Budget mode: Engineer activated...",
        isComplex,
      }) });

      let agentOutputs;
      if (isComplex) {
        const [skeptic, visionary, engineer] = await Promise.all([
          runSkeptic(enrichedQuery),
          runVisionary(enrichedQuery),
          runEngineer(enrichedQuery),
        ]);
        agentOutputs = [skeptic, visionary, engineer];
      } else {
        agentOutputs = [await runEngineer(enrichedQuery)];
      }

      for (const agent of agentOutputs) {
        await stream.writeSSE({ event: "agent_output", data: JSON.stringify({
          type: "agent_output", agent: agent.agent, output: agent.output,
          confidence: agent.confidence, temperature: agent.temperature,
        }) });
      }

      // ── Stage 3: Adversarial Debate ──
      let finalOutputs = agentOutputs;
      if (isComplex && debateRounds > 0 && agentOutputs.length >= 2) {
        await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "debate", message: "⚔️ Adversarial debate protocol initiated..." }) });
        const debateResult = await runDebateProtocol(query, agentOutputs, Math.min(debateRounds, 2));
        finalOutputs = debateResult.finalOutputs;
        for (const round of debateResult.rounds) {
          await stream.writeSSE({ event: "debate_round", data: JSON.stringify({ type: "debate_round", ...round }) });
        }
      }

      // ── Stage 4: Confidence-Weighted Synthesis ──
      await stream.writeSSE({ event: "stage", data: JSON.stringify({ type: "stage", stage: "synthesis", message: "🔮 Synthesizer integrating with confidence weighting..." }) });
      const synthesis = await runSynthesizer(query, finalOutputs);

      // ── Stage 5: Final Response ──
      await stream.writeSSE({ event: "final", data: JSON.stringify({
        type: "final",
        sessionId,
        answer: synthesis.finalAnswer,
        confidence: synthesis.overallConfidence,
        consensus: synthesis.consensus,
        dissentReport: synthesis.dissentReport,
        memoryUsed: !!memoryContext,
        agentCount: finalOutputs.length,
        agents: finalOutputs.map(a => ({ name: a.agent, confidence: a.confidence, temperature: a.temperature })),
        version: "2.0",
      }) });

      // ── Background: Save to Memory ──
      addMessage(sessionId, { role: "user", content: query, timestamp: Date.now() });
      addMessage(sessionId, { role: "assistant", content: synthesis.finalAnswer, timestamp: Date.now(), agents: finalOutputs.map(a => a.agent) });

      saveEpisode({
        timestamp: Date.now(),
        query: query.slice(0, 200),
        summary: synthesis.finalAnswer.slice(0, 200),
        agents: finalOutputs.map(a => a.agent),
        confidence: synthesis.overallConfidence,
      }).then(() => runSleepPhaseCompression()).catch(console.error);

    } catch (err: any) {
      await stream.writeSSE({ event: "error", data: JSON.stringify({ type: "error", message: err?.message || "V2 pipeline failed" }) });
    }
  });
});

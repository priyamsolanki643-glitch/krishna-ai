import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { isMockMode } from "./lib/groq.js";
import { runSupervisor } from "./pipeline/supervisor.js";
import { runDebateLoop } from "./pipeline/loop.js";

const app = new Hono();

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

// Real Streaming Endpoint
app.post("/api/chat/stream", async (c) => {
  try {
    const body = await c.req.json();
    const query = body.query;
    if (!query) {
      return c.json({ error: "Missing 'query' field in JSON body" }, 400);
    }

    return streamSSE(c, async (stream) => {
      // 1. Thinking: Supervisor Stage
      await stream.writeSSE({
        event: "thinking",
        data: JSON.stringify({
          stage: "supervisor",
          message: "Supervisor analyzing query domain and emotion...",
          is_mock: isMockMode(),
        }),
      });

      const supervisor = await runSupervisor(query);

      await stream.writeSSE({
        event: "thinking",
        data: JSON.stringify({
          stage: "supervisor_complete",
          domain: supervisor.domain,
          emotion: supervisor.emotion,
          tone_instruction: supervisor.tone_instruction,
          is_mock: supervisor.is_mock,
        }),
      });

      // 2. Thinking: Debate Loop Stage
      await stream.writeSSE({
        event: "thinking",
        data: JSON.stringify({
          stage: "debate_start",
          message: "Starting Lead and Reviewer debate rounds...",
          is_mock: isMockMode(),
        }),
      });

      const debate = await runDebateLoop(query, supervisor.tone_instruction, async (progress) => {
        await stream.writeSSE({
          event: "thinking",
          data: JSON.stringify({ ...progress, is_mock: isMockMode() }),
        });
      });

      // 3. Final Message Event
      if (debate.stopReason === "agent_failure_circuit_breaker") {
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({
            message: "agent_failure_circuit_breaker: Internal agents failed to reach consensus due to an unexpected error. Please try again later.",
            rounds: debate.rounds,
            is_mock: debate.is_mock
          }),
        });
      } else {
        await stream.writeSSE({
          event: "message",
          data: JSON.stringify({
            content: debate.finalDraft,
            rounds: debate.rounds,
            stopReason: debate.stopReason,
            leadConfidenceHistory: debate.leadConfidenceHistory,
            domain: supervisor.domain,
            emotion: supervisor.emotion,
            is_mock: debate.is_mock,
          }),
        });
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to process stream" }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

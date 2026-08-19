import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { CouncilPipeline } from '../agents/pipeline.js';
import { OmniContext } from '../types/council.types.js';

// Define dependencies (these would normally be injected or pulled from a DI container)
import { SupervisorAgent } from '../agents/supervisor.agent.js';
import { CriticAgent } from '../agents/critic.agent.js';
import { ArchitectAgent } from '../agents/architect.agent.js';
import { PlannerAgent } from '../agents/planner.agent.js';
import { ExecutorAgent } from '../agents/executor.agent.js';
import { CompilationEngine } from '../agents/compilation.js';
import { ConfidenceCalculator } from '../agents/confidence.js';
import { CounterfactualAgent } from '../agents/counterfactual.js';
import { WarRoomEngine } from '../agents/warrooms.js';
import { LLMService } from '../services/llm.service.js';
import { ToolService } from '../services/tool.service.js';

const councilRoutes = new Hono();

councilRoutes.post('/chat', async (c) => {
  const body = await c.req.json();
  const { sessionId, message, modelTier } = body;

  const llmService = new LLMService();
  const toolService = new ToolService();

  const pipeline = new CouncilPipeline(
    new SupervisorAgent(llmService),
    new CriticAgent(llmService),
    new ArchitectAgent(llmService),
    new PlannerAgent(llmService),
    new ExecutorAgent(toolService),
    new CompilationEngine(llmService),
    new ConfidenceCalculator(),
    new CounterfactualAgent(llmService),
    new WarRoomEngine(llmService),
    llmService
  );

  const context: OmniContext = {
    sessionId: sessionId || Date.now().toString(),
    modelTier: modelTier || 'standard',
    history: []
  };

  // Ensure headers for SSE
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return streamText(c, async (stream: any) => {
    const emitter = (event: any) => {
      stream.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      await pipeline.run(message, context, emitter);
    } catch (err: any) {
      emitter({ type: 'error', payload: err.message });
    }
  });
});

councilRoutes.post('/feedback', async (c) => {
  const body = await c.req.json();
  const { councilSessionId, rating, signals } = body;

  // Ideally, log this to telemetry or database
  console.log(`Received feedback for session ${councilSessionId}: rating ${rating}`, signals);

  return c.json({ success: true });
});

export default councilRoutes;

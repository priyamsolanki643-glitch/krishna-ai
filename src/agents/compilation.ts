import { z } from 'zod';
import { AgentResponse } from '../types/council.types.js';
import { LLMService } from '../services/llm.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('compilation-engine');

const CompilationSchema = z.object({
  mergedContent: z.string(),
  contradictions: z.array(z.object({
    agentA: z.string(),
    agentB: z.string(),
    topic: z.string(),
  })),
  consensusScore: z.number().min(0).max(1),
});

export class CompilationEngine {
  constructor(private llmService: LLMService) {}

  async compile(
    responses: AgentResponse[]
  ): Promise<{
    mergedContent: string;
    contradictions: Array<{ agentA: string; agentB: string; topic: string }>;
    consensusScore: number;
  }> {
    try {
      logger.info('Compiling council responses');
      const systemPrompt = `You are the Compilation Engine. Merge multiple agent responses into a coherent block. Detect contradictory statements between agents. Perform a weighted merge based on their apparent confidence. Calculate a consensus score between 0 and 1. Respond in JSON.`;
      
      const result = await this.llmService.generateJSON({
        systemPrompt,
        prompt: `Responses: ${JSON.stringify(responses)}`,
        schema: CompilationSchema,
      });

      return result as {
        mergedContent: string;
        contradictions: Array<{ agentA: string; agentB: string; topic: string }>;
        consensusScore: number;
      };
    } catch (error) {
      logger.error({ err: error }, 'Compilation failed');
      throw new Error('Compilation engine failed');
    }
  }
}

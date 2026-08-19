import { z } from 'zod';
import { OmniContext, AgentRole } from '../types/council.types.js';
import { LLMService } from '../services/llm.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('planner-agent');

const PlanSchema = z.object({
  steps: z.array(z.object({
    description: z.string(),
    tools: z.array(z.string()),
    agent: z.string(),
  })),
  estimatedComplexity: z.number().min(1).max(10),
});

export class PlannerAgent {
  constructor(private llmService: LLMService) {}

  async plan(
    message: string,
    context: OmniContext
  ): Promise<{
    steps: Array<{ description: string; tools: string[]; agent: AgentRole }>;
    estimatedComplexity: number;
  }> {
    try {
      logger.info('Planning execution steps');
      const systemPrompt = `You are the Planner Agent. Decompose the complex task into a logical series of subtasks. Identify required tools and assign an agent role to each step. Respond in JSON.`;
      
      const result = await this.llmService.generateJSON({
        systemPrompt,
        prompt: `Message: ${message}\nContext: ${JSON.stringify(context)}`,
        schema: PlanSchema,
      });

      return {
        steps: result.steps as Array<{ description: string; tools: string[]; agent: AgentRole }>,
        estimatedComplexity: result.estimatedComplexity,
      };
    } catch (error) {
      logger.error({ err: error }, 'Planning failed');
      throw new Error('Planner failed to create execution plan');
    }
  }
}

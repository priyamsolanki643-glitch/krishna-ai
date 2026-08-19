import { z } from 'zod';
import { OmniContext } from '../types/council.types.js';
import { LLMService } from '../services/llm.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('counterfactual-agent');

const CounterfactualSchema = z.object({
  biasesDetected: z.array(z.string()),
  invertedAssumptions: z.array(z.object({
    assumption: z.string(),
    inverted: z.string(),
    stillHolds: z.boolean(),
  })),
  robustnessScore: z.number().min(0).max(1),
});

export class CounterfactualAgent {
  constructor(private llmService: LLMService) {}

  async challenge(
    answer: string,
    reasoning: string,
    context: OmniContext
  ): Promise<{
    biasesDetected: string[];
    invertedAssumptions: Array<{ assumption: string; inverted: string; stillHolds: boolean }>;
    robustnessScore: number;
  }> {
    try {
      logger.info('Running counterfactual bias checks');
      const systemPrompt = `You are the Counterfactual Agent. Take the provided answer and reasoning, and identify underlying assumptions. Invert those assumptions to see if the conclusion holds. Detect potential biases. Respond in JSON.`;
      
      const result = await this.llmService.generateJSON({
        systemPrompt,
        prompt: `Answer: ${answer}\nReasoning: ${reasoning}\nContext: ${JSON.stringify(context)}`,
        schema: CounterfactualSchema,
      });

      return result as {
        biasesDetected: string[];
        invertedAssumptions: Array<{ assumption: string; inverted: string; stillHolds: boolean }>;
        robustnessScore: number;
      };
    } catch (error) {
      logger.error({ err: error }, 'Counterfactual check failed');
      throw new Error('Counterfactual agent failed');
    }
  }
}

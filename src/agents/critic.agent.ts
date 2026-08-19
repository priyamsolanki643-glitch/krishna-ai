import { z } from 'zod';
import { OmniContext, AgentResponse } from '../types/council.types.js';
import { LLMService } from '../services/llm.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('critic-agent');

const ReviewSchema = z.object({
  approved: z.boolean(),
  confidence: z.number().min(0).max(1),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export class CriticAgent {
  constructor(private llmService: LLMService) {}

  async review(
    response: AgentResponse,
    context: OmniContext
  ): Promise<{
    approved: boolean;
    confidence: number;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      logger.info('Reviewing response for quality');
      const systemPrompt = `You are the Critic Agent. Review the provided response for factual accuracy, logical flaws, missing context, and overall quality. Rate the confidence from 0.0 to 1.0. Determine if it is approved. Provide issues and suggestions. Respond in JSON.`;
      
      const result = await this.llmService.generateJSON({
        systemPrompt,
        prompt: `Response: ${JSON.stringify(response)}\nContext: ${JSON.stringify(context)}`,
        schema: ReviewSchema,
      });

      return result as {
        approved: boolean;
        confidence: number;
        issues: string[];
        suggestions: string[];
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to review response');
      return {
        approved: false,
        confidence: 0,
        issues: ['Failed to run critic review'],
        suggestions: ['Retry response generation'],
      };
    }
  }
}

import { z } from 'zod';
import { OmniContext, AgentResponse, MentorPersona } from '../types/council.types.js';
import { LLMService } from '../services/llm.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('architect-agent');

const SynthesisSchema = z.object({
  finalAnswer: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  mentorPersona: z.string(),
});

export class ArchitectAgent {
  constructor(private llmService: LLMService) {}

  async synthesize(
    responses: AgentResponse[],
    context: OmniContext
  ): Promise<{
    finalAnswer: string;
    reasoning: string;
    confidence: number;
    mentorPersona: MentorPersona;
  }> {
    try {
      logger.info('Synthesizing final response');
      const systemPrompt = `You are the Architect Agent. Take the provided council responses and synthesize a final answer. Resolve contradictions, tailor the style to the user's cognitive fingerprint, and apply an appropriate mentor persona. Respond in JSON.`;
      
      const result = await this.llmService.generateJSON({
        systemPrompt,
        prompt: `Responses: ${JSON.stringify(responses)}\nContext: ${JSON.stringify(context)}`,
        schema: SynthesisSchema,
      });

      return {
        finalAnswer: result.finalAnswer,
        reasoning: result.reasoning,
        confidence: result.confidence,
        mentorPersona: result.mentorPersona as MentorPersona,
      };
    } catch (error) {
      logger.error({ err: error }, 'Synthesis failed');
      throw new Error('Architect synthesis failed');
    }
  }
}

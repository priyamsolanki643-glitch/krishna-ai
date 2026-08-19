import { z } from 'zod';
import { OmniContext, IntentAnalysis, AgentRole } from '../types/council.types.js';
import { LLMService } from '../services/llm.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('supervisor-agent');

const IntentSchema = z.object({
  intent: z.string(),
  emotion: z.string(),
  domain: z.string(),
  complexity: z.number().min(1).max(10),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
});

export class SupervisorAgent {
  constructor(private llmService: LLMService) {}

  async analyze(message: string, context: OmniContext): Promise<IntentAnalysis> {
    try {
      logger.info('Analyzing user intent');
      const systemPrompt = `You are the Supervisor Agent. Analyze the user's message and determine the intent, emotion, domain, complexity (1-10), and urgency. Respond strictly in JSON matching the schema.`;
      const response = await this.llmService.generateJSON({
        systemPrompt,
        prompt: `Message: ${message}\nContext: ${JSON.stringify(context)}`,
        schema: IntentSchema,
      });
      return response as IntentAnalysis;
    } catch (error) {
      logger.error({ err: error }, 'Failed to analyze intent');
      throw new Error('Supervisor analysis failed');
    }
  }

  async assembleTeam(intent: IntentAnalysis): Promise<AgentRole[]> {
    logger.info('Assembling team based on intent');
    const team: AgentRole[] = ['architect', 'critic'];
    if (intent.complexity > 4) {
      team.push('planner', 'executor');
    }
    if (intent.complexity > 7) {
      team.push('counterfactual');
    }
    return team;
  }

  async decidePath(intent: IntentAnalysis): Promise<'fast' | 'deep'> {
    logger.info('Deciding execution path');
    if (intent.complexity <= 4 && (intent.urgency === 'low' || intent.urgency === 'medium')) {
      return 'fast';
    }
    return 'deep';
  }
}

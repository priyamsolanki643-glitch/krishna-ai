import { z } from 'zod';
import { OmniContext, AgentRole, DebateLog } from '../types/council.types.js';
import { LLMService } from '../services/llm.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('warroom-engine');

const DebateSchema = z.object({
  rounds: z.array(z.object({
    agentId: z.string(),
    position: z.string(),
    argument: z.string(),
  })),
  conclusion: z.string(),
  winningPosition: z.string(),
});

export class WarRoomEngine {
  constructor(private llmService: LLMService) {}

  async runDebate(
    topic: string,
    agents: AgentRole[],
    context: OmniContext
  ): Promise<{
    rounds: DebateLog[];
    conclusion: string;
    winningPosition: string;
  }> {
    try {
      logger.info(`Running debate on topic: ${topic}`);
      const systemPrompt = `You are the War Room Engine. Simulate a structured round-robin debate among the specified agents regarding the topic. Outline their arguments and counterpoints. Determine the conclusion and winning position. Respond in JSON.`;
      
      const result = await this.llmService.generateJSON({
        systemPrompt,
        prompt: `Topic: ${topic}\nAgents: ${JSON.stringify(agents)}\nContext: ${JSON.stringify(context)}`,
        schema: DebateSchema,
      });

      return result as {
        rounds: DebateLog[];
        conclusion: string;
        winningPosition: string;
      };
    } catch (error) {
      logger.error({ err: error }, 'WarRoom debate failed');
      throw new Error('WarRoom engine failed');
    }
  }
}

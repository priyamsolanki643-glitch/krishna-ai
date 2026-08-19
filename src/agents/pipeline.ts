import { OmniContext, CouncilSession, SSEEvent } from '../types/council.types.js';
import { SupervisorAgent } from './supervisor.agent.js';
import { CriticAgent } from './critic.agent.js';
import { ArchitectAgent } from './architect.agent.js';
import { PlannerAgent } from './planner.agent.js';
import { ExecutorAgent } from './executor.agent.js';
import { CompilationEngine } from './compilation.js';
import { ConfidenceCalculator } from './confidence.js';
import { CounterfactualAgent } from './counterfactual.js';
import { WarRoomEngine } from './warrooms.js';
import { LLMService } from '../services/llm.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('council-pipeline');

export class CouncilPipeline {
  constructor(
    private supervisor: SupervisorAgent,
    private critic: CriticAgent,
    private architect: ArchitectAgent,
    private planner: PlannerAgent,
    private executor: ExecutorAgent,
    private compilation: CompilationEngine,
    private confidence: ConfidenceCalculator,
    private counterfactual: CounterfactualAgent,
    private warroom: WarRoomEngine,
    private llmService: LLMService
  ) {}

  async run(
    message: string,
    context: OmniContext,
    emitter: (event: SSEEvent) => void
  ): Promise<CouncilSession> {
    try {
      logger.info('Starting council pipeline');
      emitter({ type: 'stage_update', payload: 'supervisor_analysis' });
      
      const intent = await this.supervisor.analyze(message, context);
      const path = await this.supervisor.decidePath(intent);
      const team = await this.supervisor.assembleTeam(intent);
      
      emitter({ type: 'team_assembled', payload: team });

      if (path === 'fast') {
        emitter({ type: 'stage_update', payload: 'fast_path_generation' });
        const directResponse = await this.llmService.generateText({
          prompt: message,
          systemPrompt: 'You are Omni-Nexus. Provide a direct, clear answer.',
        });
        
        emitter({ type: 'stage_update', payload: 'critic_review' });
        const review = await this.critic.review({ content: directResponse, agentId: 'direct', confidence: 1 }, context);
        
        const finalContent = review.approved ? directResponse : directResponse + '\\n\\n(Note: Suboptimal confidence)';
        
        emitter({ type: 'message', payload: finalContent });
        emitter({ type: 'done', payload: { path: 'fast', telemetry: review } });
        
        return {
          id: Date.now().toString(),
          path: 'fast',
          finalAnswer: finalContent,
          telemetry: review
        } as CouncilSession;
      }

      // Deep Path
      emitter({ type: 'stage_update', payload: 'planning' });
      const plan = await this.planner.plan(message, context);
      
      let toolsOutput = '';
      if (plan.steps.some(s => s.tools.length > 0)) {
        emitter({ type: 'stage_update', payload: 'executing_tools' });
        for (const step of plan.steps.filter(s => s.tools.length > 0)) {
          const result = await this.executor.execute(step, context);
          toolsOutput += JSON.stringify(result) + '\\n';
        }
      }

      let debateResults = '';
      if (intent.complexity > 7) {
        emitter({ type: 'stage_update', payload: 'warroom_debate' });
        const debate = await this.warroom.runDebate(message, team, context);
        debateResults = debate.conclusion;
      }

      emitter({ type: 'stage_update', payload: 'compiling' });
      const rawResponses = [{ content: toolsOutput + '\\n' + debateResults, agentId: 'council', confidence: 0.8 }];
      const compiled = await this.compilation.compile(rawResponses);
      
      emitter({ type: 'stage_update', payload: 'counterfactual_check' });
      await this.counterfactual.challenge(compiled.mergedContent, 'council consensus', context);
      
      emitter({ type: 'stage_update', payload: 'confidence_check' });
      this.confidence.calculate(rawResponses, intent);

      emitter({ type: 'stage_update', payload: 'architect_synthesis' });
      emitter({ type: 'thinking', payload: 'Synthesizing final response...' });
      
      let finalSynthesis = await this.architect.synthesize(rawResponses, context);
      
      emitter({ type: 'stage_update', payload: 'critic_review' });
      let review = await this.critic.review({ content: finalSynthesis.finalAnswer, agentId: 'architect', confidence: finalSynthesis.confidence }, context);
      
      let iterations = 0;
      while (!review.approved && iterations < 2) {
        logger.warn('Critic rejected synthesis, regenerating...');
        iterations++;
        finalSynthesis = await this.architect.synthesize([{ content: finalSynthesis.finalAnswer + '\\nFix issues: ' + review.issues.join(','), agentId: 'architect', confidence: 0.5 }], context);
        review = await this.critic.review({ content: finalSynthesis.finalAnswer, agentId: 'architect', confidence: finalSynthesis.confidence }, context);
      }

      emitter({ type: 'message', payload: finalSynthesis.finalAnswer });
      emitter({ type: 'done', payload: { path: 'deep', iterations } });

      return {
        id: Date.now().toString(),
        path: 'deep',
        finalAnswer: finalSynthesis.finalAnswer,
        telemetry: review
      } as CouncilSession;

    } catch (error: any) {
      logger.error('Pipeline failed', error);
      emitter({ type: 'message', payload: 'Internal error during council processing.' });
      emitter({ type: 'done', payload: { error: error.message } });
      throw error;
    }
  }
}

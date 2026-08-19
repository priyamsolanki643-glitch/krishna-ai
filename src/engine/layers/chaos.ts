import { OmniContext, OmniLayerResult } from '../../types/council.types.js';
import { pino } from 'pino';
import { llmService as llm } from '../../services/llm.service.js';

const logger = pino({ name: 'ChaosLayer' });

type ChaosType = 'creative_challenge' | 'perspective_flip' | 'paradigm_shift' | 'random_insight';

export class ChaosLayer {
  /**
   * Layer 15: Structured randomness injection
   * - Detects if user is stuck in monotonous patterns
   * - Injects creative challenges, unexpected perspectives, or paradigm shifts
   * - Controlled chaos: never during crisis, only when momentum is stable
   */
  async process(message: string, context: OmniContext): Promise<OmniLayerResult & {
    chaosInjected: boolean;
    chaosType?: ChaosType;
    chaosContent?: string;
  }> {
    logger.info({ sessionId: context.sessionId }, 'Processing Layer 15: Chaos Volatility');
    
    // Safety check: Never inject chaos during crisis
    if (context.selectedMentor === 'Crisis Support' || (context.warmth && context.warmth > 0.8)) {
      return {
        layerIndex: 15,
        layerName: 'Chaos Volatility',
        status: 'skipped',
        chaosInjected: false,
        findings: ['Skipped due to high emotional need / crisis']
      };
    }

    // Determine if we should inject chaos (e.g., stalled momentum but not in crisis)
    // For now, let's give it a 15% random chance if things are stable
    const shouldInjectChaos = (context.momentum === 'stalled' && Math.random() > 0.5) || Math.random() > 0.85;

    if (!shouldInjectChaos) {
      context.chaosInjected = false;
      return {
        layerIndex: 15,
        layerName: 'Chaos Volatility',
        status: 'success',
        chaosInjected: false
      };
    }

    try {
      const chaosTypes: ChaosType[] = ['creative_challenge', 'perspective_flip', 'paradigm_shift', 'random_insight'];
      const selectedType = chaosTypes[Math.floor(Math.random() * chaosTypes.length)];

      const chaosGen = await llm.generateStructured<{ content: string }>(
        `Generate a brief, unexpected ${selectedType} for the user.
        Context message: "${message}"
        
        Guidelines:
        - 'creative_challenge': A quick puzzle or constraints (e.g. "Explain this in 3 words").
        - 'perspective_flip': Argue the exact opposite of what they just said.
        - 'paradigm_shift': Introduce a completely unrelated discipline (e.g. biology, architecture) to their problem.
        - 'random_insight': A profound but slightly absurd observation.
        Keep it under 2 sentences.`,
        'Generate structured chaos'
      );

      context.chaosInjected = true;
      context.chaosType = selectedType;
      context.chaosContent = chaosGen?.content || 'Consider the opposite of what you just concluded.';

      return {
        layerIndex: 15,
        layerName: 'Chaos Volatility',
        status: 'success',
        chaosInjected: true,
        chaosType: selectedType,
        chaosContent: context.chaosContent,
        metrics: { chaosType: selectedType }
      };

    } catch (error) {
      logger.error({ err: error, sessionId: context.sessionId }, 'Error in Chaos layer');
      context.chaosInjected = false;
      return {
        layerIndex: 15,
        layerName: 'Chaos Volatility',
        status: 'failed',
        chaosInjected: false
      };
    }
  }
}

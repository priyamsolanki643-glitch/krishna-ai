import { OmniContext, OmniLayerResult } from '../../types/council.types.js';
import { pino } from 'pino';
import { llmService as llm } from '../../services/llm.service.js';

const logger = pino({ name: 'FrictionLayer' });

export class FrictionLayer {
  /**
   * Layer 6: Friction Coefficient calculation
   *   - How much resistance is the user facing?
   *   - Combines: missed deadlines, incomplete tasks, time-on-task trends
   * Layer 7: Procrastination detection
   *   - Pattern matching: repeatedly starting but not finishing
   *   - Dopamine-loop detection (switching tasks rapidly)
   * Layer 8: Ambition calibration
   *   - Is the user setting realistic goals?
   *   - Over-ambition vs under-ambition scoring
   * Layer 9: Momentum assessment
   *   - Current momentum: accelerating, decelerating, or stalled
   *   - Recommended intervention type
   */
  async process(message: string, context: OmniContext): Promise<OmniLayerResult[]> {
    logger.info({ sessionId: context.sessionId }, 'Processing Layers 6-9: Friction & Ambition');
    
    const results: OmniLayerResult[] = [];
    
    try {
      // Prompt LLM to analyze behavioral markers based on the message and history
      const behaviorAnalysis = await llm.generateStructured<{
        frictionLevel: number;
        procrastinationDetected: boolean;
        ambitionScore: number;
        momentumState: 'accelerating' | 'decelerating' | 'stalled';
        recommendedIntervention: string;
      }>(
        `Analyze the user's message for behavioral markers:
        Message: "${message}"
        History length: ${context.history?.length || 0} messages
        
        Provide:
        1. frictionLevel (0-1): How much resistance/difficulty they express
        2. procrastinationDetected (boolean): Any signs of avoiding work or dopamine-looping?
        3. ambitionScore (0-1): Is the goal realistic (0.5), over-ambitious (1.0) or under-ambitious (0.0)?
        4. momentumState: 'accelerating', 'decelerating', or 'stalled'
        5. recommendedIntervention: Brief suggestion for what would help`,
        'Analyze behavioral markers'
      );

      const frictionCoeff = behaviorAnalysis?.frictionLevel ?? 0.5;
      context.frictionCoefficient = frictionCoeff;

      results.push({
        layerIndex: 6,
        layerName: 'Friction Coefficient',
        status: 'success',
        metrics: { frictionCoefficient: frictionCoeff }
      });

      const procFlag = behaviorAnalysis?.procrastinationDetected ?? false;
      context.procrastinationFlag = procFlag;

      results.push({
        layerIndex: 7,
        layerName: 'Procrastination Detection',
        status: 'success',
        findings: procFlag ? ['Procrastination or dopamine-looping detected'] : []
      });

      results.push({
        layerIndex: 8,
        layerName: 'Ambition Calibration',
        status: 'success',
        metrics: { ambitionScore: behaviorAnalysis?.ambitionScore ?? 0.5 }
      });

      const momentum = behaviorAnalysis?.momentumState ?? 'stalled';
      context.momentum = momentum;

      results.push({
        layerIndex: 9,
        layerName: 'Momentum Assessment',
        status: 'success',
        metrics: { momentum },
        interventions: behaviorAnalysis?.recommendedIntervention ? [behaviorAnalysis.recommendedIntervention] : []
      });

    } catch (error) {
      logger.error({ err: error, sessionId: context.sessionId }, 'Error in Friction layers');
      for (let i = 6; i <= 9; i++) {
        results.push({
          layerIndex: i,
          layerName: `Friction Sublayer ${i}`,
          status: 'failed'
        });
      }
    }

    return results;
  }
}

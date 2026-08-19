import { IntentAnalysis, AgentResponse } from '../types/council.types.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('confidence-calculator');

export class ConfidenceCalculator {
  calculate(
    responses: AgentResponse[],
    intent: IntentAnalysis
  ): {
    overall: number;
    breakdown: Record<string, number>;
    uncertainAreas: string[];
  } {
    logger.info('Calculating epistemic confidence');
    
    let overall = 0;
    const breakdown: Record<string, number> = {};
    const uncertainAreas: string[] = [];

    if (responses.length === 0) {
      return { overall: 0, breakdown, uncertainAreas: ['No responses provided'] };
    }

    let totalScore = 0;
    responses.forEach(r => {
      const score = (r.confidence ?? 0.5) * 100;
      breakdown[r.agentId || 'unknown'] = score;
      totalScore += score;
      
      if (score < 50) {
        uncertainAreas.push(`Agent ${r.agentId} had low confidence on their sub-task.`);
      }
    });

    overall = totalScore / responses.length;

    if (intent.complexity > 7 && overall < 70) {
      uncertainAreas.push('High complexity query resulted in sub-optimal confidence.');
    }

    return {
      overall,
      breakdown,
      uncertainAreas,
    };
  }
}

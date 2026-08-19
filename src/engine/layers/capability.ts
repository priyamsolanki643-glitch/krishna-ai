import { OmniContext, OmniLayerResult } from '../../types/council.types.js';
import { pino } from 'pino';
import { llmService as llm } from '../../services/llm.service.js';

const logger = pino({ name: 'CapabilityLayer' });

export class CapabilityLayer {
  /**
   * Layer 2: Task difficulty assessment
   * Layer 3: User capability mapping against task requirements
   * Layer 4: Monte Carlo simulation for pass probability
   * Layer 5: Resource gap analysis (what user needs to learn/do)
   */
  async process(message: string, context: OmniContext): Promise<OmniLayerResult[]> {
    logger.info({ sessionId: context.sessionId }, 'Processing Layers 2-5: Capability & Simulation');
    
    const results: OmniLayerResult[] = [];
    
    try {
      // LLM call to assess difficulty and identify required resources
      const assessment = await llm.generateStructured<{
        difficultyScore: number;
        requiredCapabilities: string[];
        resourceGaps: string[];
      }>(
        `Assess the task or request from the user message: "${message}"
        Provide:
        1. difficultyScore: 0 to 100
        2. requiredCapabilities: list of skills needed
        3. resourceGaps: list of things the user likely lacks based on a general baseline`,
        'Assess task difficulty and gaps'
      );

      // Layer 2: Task difficulty
      results.push({
        layerIndex: 2,
        layerName: 'Task Difficulty Assessment',
        status: 'success',
        metrics: { difficultyScore: assessment?.difficultyScore ?? 50 }
      });

      // Layer 3: Capability mapping
      const userCap = context.baselineCapability || 50;
      const difficulty = assessment?.difficultyScore ?? 50;
      const capabilityGap = difficulty - userCap;
      
      results.push({
        layerIndex: 3,
        layerName: 'Capability Mapping',
        status: 'success',
        metrics: { userCapability: userCap, capabilityGap }
      });

      // Layer 4: Monte Carlo Simulation (simplified approximation)
      // Pass probability calculation
      let passProb = 0.5; // Base 50%
      if (capabilityGap <= 0) passProb = 0.8 + (Math.random() * 0.15); // 80-95%
      else passProb = Math.max(0.1, 0.8 - (capabilityGap * 0.01)); // drops 1% per gap point

      context.passProbability = passProb;

      results.push({
        layerIndex: 4,
        layerName: 'Monte Carlo Simulation',
        status: 'success',
        metrics: { passProbability: passProb }
      });

      // Layer 5: Resource Gap Analysis
      context.resourceGaps = assessment?.resourceGaps || [];
      results.push({
        layerIndex: 5,
        layerName: 'Resource Gap Analysis',
        status: 'success',
        findings: context.resourceGaps
      });

    } catch (error) {
      logger.error({ err: error, sessionId: context.sessionId }, 'Error in Capability layers');
      for (let i = 2; i <= 5; i++) {
        results.push({
          layerIndex: i,
          layerName: `Capability Sublayer ${i}`,
          status: 'failed'
        });
      }
    }

    return results;
  }
}

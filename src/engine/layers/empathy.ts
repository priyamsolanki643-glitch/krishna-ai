import { OmniContext, OmniLayerResult, MentorPersona } from '../../types/council.types.js';
import { pino } from 'pino';
import { llmService as llm } from '../../services/llm.service.js';

const logger = pino({ name: 'EmpathyLayer' });

export class EmpathyLayer {
  /**
   * Layer 14:
   * - Compute Warmth score (0-1): How much emotional support needed?
   * - Compute ToughLoveRatio (0-1): How much direct/blunt should we be?
   * - Compute HopeSignal (0-1): Does user need encouragement?
   * - Select one of 4 Mentor Personas based on scores:
   *   - High warmth + low tough love = Crisis Support or Visionary
   *   - Low warmth + high tough love = Drill Sergeant
   *   - Balanced = Accountability Partner
   */
  async process(message: string, context: OmniContext): Promise<OmniLayerResult & {
    warmth: number;
    toughLoveRatio: number;
    hopeSignal: number;
    selectedMentor: MentorPersona;
  }> {
    logger.info({ sessionId: context.sessionId }, 'Processing Layer 14: Empathy & Tone Selection');
    
    try {
      const emotionalProfile = await llm.generateStructured<{
        warmth: number;
        toughLoveRatio: number;
        hopeSignal: number;
      }>(
        `Analyze the emotional needs of the user based on their message:
        Message: "${message}"
        Friction Level: ${context.frictionCoefficient ?? 0.5}
        Procrastinating: ${context.procrastinationFlag ?? false}
        
        Provide scores between 0.0 and 1.0 for:
        1. warmth: Need for emotional support and gentleness
        2. toughLoveRatio: Need for direct, blunt accountability
        3. hopeSignal: Need for inspiration and encouragement`,
        'Assess emotional needs'
      );

      const warmth = emotionalProfile?.warmth ?? 0.5;
      const toughLoveRatio = emotionalProfile?.toughLoveRatio ?? 0.5;
      const hopeSignal = emotionalProfile?.hopeSignal ?? 0.5;

      let selectedMentor: MentorPersona = 'Accountability Partner';

      if (warmth > 0.8 && toughLoveRatio < 0.4) {
        // High emotional distress
        selectedMentor = 'Crisis Support';
      } else if (warmth > 0.6 && hopeSignal > 0.7) {
        selectedMentor = 'Visionary';
      } else if (toughLoveRatio > 0.7 && warmth < 0.5) {
        // Needs a push, procrastination detected
        selectedMentor = 'Drill Sergeant';
      }
      
      // Override if specifically procrastinating heavily
      if (context.procrastinationFlag && warmth < 0.8) {
        selectedMentor = 'Drill Sergeant';
      }

      context.warmth = warmth;
      context.toughLoveRatio = toughLoveRatio;
      context.hopeSignal = hopeSignal;
      context.selectedMentor = selectedMentor;

      return {
        layerIndex: 14,
        layerName: 'Empathy & Tone Selection',
        status: 'success',
        warmth,
        toughLoveRatio,
        hopeSignal,
        selectedMentor,
        metrics: { warmth, toughLoveRatio, hopeSignal, selectedMentor }
      };

    } catch (error) {
      logger.error({ err: error, sessionId: context.sessionId }, 'Error in Empathy layer');
      
      const defaultMentor: MentorPersona = 'Accountability Partner';
      context.selectedMentor = defaultMentor;
      
      return {
        layerIndex: 14,
        layerName: 'Empathy & Tone Selection',
        status: 'failed',
        warmth: 0.5,
        toughLoveRatio: 0.5,
        hopeSignal: 0.5,
        selectedMentor: defaultMentor
      };
    }
  }
}

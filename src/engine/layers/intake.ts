import { OmniContext, OmniLayerResult } from '../../types/council.types.js';
import { llmService as llm } from '../../services/llm.service.js';
import { pino } from 'pino';

const logger = pino({ name: 'IntakeLayer' });

export class IntakeLayer {
  /**
   * Layer 0: Parse and normalize the incoming message
   * - Extract intent signals, language, urgency indicators
   * - Detect if message is a question, command, vent, etc.
   */
  async processLayer0(message: string, context: OmniContext): Promise<OmniLayerResult> {
    logger.info({ sessionId: context.sessionId }, 'Processing Layer 0: Intake');
    
    try {
      const response = await llm.generateStructured<{
        intent: string;
        urgency: string;
        messageType: string;
      }>(
        `Analyze the following user message:
        Message: "${message}"
        
        Provide:
        1. intent: Primary goal of the message.
        2. urgency: 'low', 'medium', 'high', 'critical'
        3. messageType: 'question', 'command', 'vent', 'update', 'other'`,
        'Analyze user intent and urgency'
      );

      return {
        layerIndex: 0,
        layerName: 'Intake',
        status: 'success',
        metrics: {
          intent: response?.intent || 'unknown',
          urgency: response?.urgency || 'medium',
          messageType: response?.messageType || 'other'
        }
      };
    } catch (error) {
      logger.error({ err: error, sessionId: context.sessionId }, 'Error in Layer 0');
      return {
        layerIndex: 0,
        layerName: 'Intake',
        status: 'failed'
      };
    }
  }
  
  /**
   * Layer 1: Intelligence baseline
   * - Pull user's streak data, active days count
   * - Calculate current baseline capability score
   * - Track improvement trajectory
   */
  async processLayer1(userId: string, context: OmniContext): Promise<OmniLayerResult> {
    logger.info({ userId, sessionId: context.sessionId }, 'Processing Layer 1: Intelligence Baseline');
    
    // In a real implementation, we would query the database here.
    // Simulating the DB lookup for baseline capabilities
    const streakDays = context.streakDays ?? Math.floor(Math.random() * 30);
    const activeDays = context.activeDays ?? Math.floor(Math.random() * 100);
    
    const baselineCapability = Math.min((streakDays * 2) + (activeDays * 0.5), 100);
    
    context.streakDays = streakDays;
    context.activeDays = activeDays;
    context.baselineCapability = baselineCapability;

    return {
      layerIndex: 1,
      layerName: 'Intelligence Baseline',
      status: 'success',
      metrics: {
        streakDays,
        activeDays,
        baselineCapability
      }
    };
  }
}

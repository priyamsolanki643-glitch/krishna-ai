import { OmniContext, OmniLayerResult } from '../../types/council.types.js';
import { pino } from 'pino';
import { llmService as llm } from '../../services/llm.service.js';

const logger = pino({ name: 'AccountabilityLayer' });

export class AccountabilityLayer {
  /**
   * Layer 10: Compliance check — is the response safe and appropriate?
   * Layer 11: Minor protection — block unauthorized medical/financial/legal advice
   * Layer 12: Content moderation — flag harmful content
   * Layer 13: Audit trail — log all decisions for transparency
   */
  async process(message: string, context: OmniContext): Promise<OmniLayerResult[]> {
    logger.info({ sessionId: context.sessionId }, 'Processing Layers 10-13: Accountability & Legal Audit');
    
    const results: OmniLayerResult[] = [];
    
    try {
      // Analyze for safety and compliance
      const compliance = await llm.generateStructured<{
        isSafe: boolean;
        hasUnauthorizedAdvice: boolean;
        harmfulContentFlag: boolean;
        auditNotes: string;
      }>(
        `Review the user message for safety and compliance:
        Message: "${message}"
        
        Provide:
        1. isSafe (boolean)
        2. hasUnauthorizedAdvice (boolean) - specifically medical, financial, or legal advice that we shouldn't give
        3. harmfulContentFlag (boolean) - hate speech, self-harm, etc.
        4. auditNotes (string) - brief reason for these flags`,
        'Compliance and safety check'
      );

      results.push({
        layerIndex: 10,
        layerName: 'Compliance Check',
        status: 'success',
        metrics: { isSafe: compliance?.isSafe ?? true }
      });

      results.push({
        layerIndex: 11,
        layerName: 'Minor Protection / Advice Block',
        status: compliance?.hasUnauthorizedAdvice ? 'failed' : 'success',
        findings: compliance?.hasUnauthorizedAdvice ? ['Unauthorized advice requested'] : []
      });

      results.push({
        layerIndex: 12,
        layerName: 'Content Moderation',
        status: compliance?.harmfulContentFlag ? 'failed' : 'success',
        findings: compliance?.harmfulContentFlag ? ['Harmful content detected'] : []
      });

      // Layer 13: Audit trail logging
      logger.info({
        sessionId: context.sessionId,
        auditNotes: compliance?.auditNotes || 'Clean',
        flags: {
          hasUnauthorizedAdvice: compliance?.hasUnauthorizedAdvice,
          harmfulContentFlag: compliance?.harmfulContentFlag
        }
      }, 'Audit Trail Logged');

      results.push({
        layerIndex: 13,
        layerName: 'Audit Trail',
        status: 'success',
        findings: ['Audit logged securely']
      });

    } catch (error) {
      logger.error({ err: error, sessionId: context.sessionId }, 'Error in Accountability layers');
      for (let i = 10; i <= 13; i++) {
        results.push({
          layerIndex: i,
          layerName: `Accountability Sublayer ${i}`,
          status: 'failed'
        });
      }
    }

    return results;
  }
}

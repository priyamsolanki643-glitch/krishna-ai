import { OmniContext, OmniLayerResult, MentorPersona } from '../types/council.types.js';
import { pino } from 'pino';
import { IntakeLayer } from './layers/intake.js';
import { CapabilityLayer } from './layers/capability.js';
import { FrictionLayer } from './layers/friction.js';
import { AccountabilityLayer } from './layers/accountability.js';
import { EmpathyLayer } from './layers/empathy.js';
import { ChaosLayer } from './layers/chaos.js';

const logger = pino({ name: 'OmniEngine' });

export class OmniEngine {
  private intakeLayer = new IntakeLayer();
  private capabilityLayer = new CapabilityLayer();
  private frictionLayer = new FrictionLayer();
  private accountabilityLayer = new AccountabilityLayer();
  private empathyLayer = new EmpathyLayer();
  private chaosLayer = new ChaosLayer();

  /**
   * Process a message through the 16-layer pipeline.
   * Determines fast vs deep path, runs appropriate layers,
   * and returns enriched OmniContext.
   */
  async process(userId: string, message: string, existingContext?: OmniContext): Promise<OmniContext> {
    logger.info({ userId, sessionId: existingContext?.sessionId }, 'Starting OmniEngine processing');
    
    let context: OmniContext = existingContext || {
      sessionId: `session_${Date.now()}`,
      history: []
    };

    // Always run Layer 0 (Intake) to determine intent/urgency
    const layer0Result = await this.intakeLayer.processLayer0(message, context);
    
    // Check if we should trigger Deep Path
    const isDeepPath = this.shouldTriggerDeepPath(message, context, layer0Result);

    if (isDeepPath) {
      logger.info('Routing to Deep Path');
      await this.runDeepPath(userId, message, context);
    } else {
      logger.info('Routing to Fast Path');
      await this.runFastPath(userId, message, context);
    }

    return context;
  }
  
  /**
   * Determine if this message triggers the deep path
   */
  private shouldTriggerDeepPath(message: string, context: OmniContext, layer0Result: OmniLayerResult): boolean {
    // Triggers for deep path:
    // 1. Critical urgency
    if (layer0Result.metrics?.urgency === 'critical') return true;
    
    // 2. High friction or stalled momentum previously detected
    if (context.frictionCoefficient && context.frictionCoefficient > 0.8) return true;
    if (context.momentum === 'stalled') return true;

    // 3. 10% random chance for deep review (or forced by system logic like weekly review)
    if (Math.random() < 0.1) return true;

    // 4. Burnout detection keywords
    const burnoutKeywords = ['burnout', 'give up', 'too much', 'overwhelmed', 'exhausted', 'can\'t do this'];
    if (burnoutKeywords.some(kw => message.toLowerCase().includes(kw))) return true;

    return false;
  }
  
  /**
   * Run all 16 layers sequentially
   */
  private async runDeepPath(userId: string, message: string, context: OmniContext): Promise<OmniLayerResult[]> {
    const results: OmniLayerResult[] = [];
    
    // Layer 1
    results.push(await this.intakeLayer.processLayer1(userId, context));
    
    // Layers 2-5
    results.push(...await this.capabilityLayer.process(message, context));
    
    // Layers 6-9
    results.push(...await this.frictionLayer.process(message, context));
    
    // Layers 10-13
    results.push(...await this.accountabilityLayer.process(message, context));
    
    // Layer 14
    const empathyResult = await this.empathyLayer.process(message, context);
    results.push(empathyResult);
    
    // Layer 15
    results.push(await this.chaosLayer.process(message, context));

    // Handle Mentor Selection (Implicitly done in Empathy layer, but we can log/finalize it)
    this.selectMentor(empathyResult);

    return results;
  }
  
  /**
   * Fast path: use cached context, only update basic metrics
   */
  private async runFastPath(userId: string, message: string, context: OmniContext): Promise<OmniContext> {
    // Only run accountability to ensure safety
    await this.accountabilityLayer.process(message, context);
    
    // Re-evaluate empathy quickly to adjust mentor if needed
    await this.empathyLayer.process(message, context);
    
    return context;
  }
  
  /**
   * Select mentor persona based on layer 14 results
   */
  private selectMentor(empathyResult: any): MentorPersona {
    // The selection logic is primarily in EmpathyLayer.
    // We just extract it here to satisfy the architectural requirement.
    return empathyResult.selectedMentor || 'Accountability Partner';
  }
}

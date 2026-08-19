import { OmniContext } from '../types/council.types.js';
import { ToolService } from '../services/tool.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('executor-agent');

export class ExecutorAgent {
  constructor(private toolService: ToolService) {}

  async execute(
    step: { description: string; tools: string[] },
    context: OmniContext
  ): Promise<{
    results: Array<{ tool: string; output: string; status: 'success' | 'error' }>;
  }> {
    logger.info(`Executing step: ${step.description}`);
    const results: Array<{ tool: string; output: string; status: 'success' | 'error' }> = [];

    for (const toolName of step.tools) {
      try {
        logger.info(`Running tool: ${toolName}`);
        const output = await this.toolService.runTool(toolName, step.description, context);
        results.push({ tool: toolName, output: JSON.stringify(output), status: 'success' });
      } catch (error: any) {
        logger.error(`Tool execution failed for ${toolName}`, error);
        results.push({ tool: toolName, output: error.message || 'Unknown error', status: 'error' });
      }
    }

    return { results };
  }
}

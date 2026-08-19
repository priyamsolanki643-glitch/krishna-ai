import { z } from 'zod';
import { createLogger } from '../utils/logger.js';

const log = createLogger('tool-registry');

// ============================================================
// Tool Registry — Registration, Discovery & Execution
// ============================================================

/** Tool definition schema */
export interface ToolDefinition {
  name: string;
  description: string;
  category: 'search' | 'code' | 'memory' | 'utility' | 'external';
  parameters: z.ZodType;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
  enabled: boolean;
}

/** Tool execution result */
export interface ToolResult {
  output: string;
  status: 'success' | 'error' | 'timeout';
  executionTimeMs: number;
  metadata?: Record<string, unknown>;
}

/** Serialized tool info for API responses */
export interface ToolInfo {
  name: string;
  description: string;
  category: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
}

/**
 * Central Tool Registry
 * 
 * Manages registration, discovery, and execution of all available tools.
 * Tools are registered at startup and can be dynamically enabled/disabled.
 */
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a new tool
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      log.warn({ tool: tool.name }, 'Tool already registered — overwriting');
    }
    this.tools.set(tool.name, tool);
    log.info({ tool: tool.name, category: tool.category }, 'Tool registered');
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools (serialized for API)
   */
  list(): ToolInfo[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters._def?.description ?? {},
      enabled: tool.enabled,
    }));
  }

  /**
   * List only enabled tools
   */
  listEnabled(): ToolInfo[] {
    return this.list().filter((t) => t.enabled);
  }

  /**
   * Execute a tool by name with validated arguments
   */
  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        output: `Tool '${name}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
        status: 'error',
        executionTimeMs: 0,
      };
    }

    if (!tool.enabled) {
      return {
        output: `Tool '${name}' is currently disabled`,
        status: 'error',
        executionTimeMs: 0,
      };
    }

    // Validate arguments
    const validation = tool.parameters.safeParse(args);
    if (!validation.success) {
      return {
        output: `Invalid arguments for tool '${name}': ${validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        status: 'error',
        executionTimeMs: 0,
      };
    }

    // Execute with timeout
    const startTime = Date.now();
    try {
      log.info({ tool: name, args: validation.data }, 'Executing tool');

      const result = await Promise.race([
        tool.execute(validation.data as Record<string, unknown>),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout (30s)')), 30_000)
        ),
      ]);

      const executionTimeMs = Date.now() - startTime;
      log.info({ tool: name, status: result.status, duration: `${executionTimeMs}ms` }, 'Tool execution complete');

      return { ...result, executionTimeMs };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      log.error({ tool: name, error: (error as Error).message }, 'Tool execution failed');

      return {
        output: `Tool execution failed: ${(error as Error).message}`,
        status: 'error',
        executionTimeMs,
      };
    }
  }

  /**
   * Enable or disable a tool
   */
  setEnabled(name: string, enabled: boolean): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;
    tool.enabled = enabled;
    log.info({ tool: name, enabled }, 'Tool status updated');
    return true;
  }

  /**
   * Get tool count
   */
  get size(): number {
    return this.tools.size;
  }
}

/** Singleton tool registry */
export const toolRegistry = new ToolRegistry();

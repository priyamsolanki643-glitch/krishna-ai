import { z } from 'zod';
import { toolRegistry } from './registry.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('code-exec-tool');

// ============================================================
// Code Execution Tool — Sandboxed JavaScript/TypeScript Eval
// ============================================================

const CodeExecParams = z.object({
  code: z.string().min(1).max(10000).describe('JavaScript/TypeScript code to execute'),
  language: z.enum(['javascript', 'typescript', 'python']).default('javascript'),
  timeout: z.number().min(100).max(30000).default(5000).describe('Execution timeout in ms'),
});

// ── Blocked patterns for security ──
const BLOCKED_PATTERNS = [
  /require\s*\(\s*['"]child_process['"]\s*\)/,
  /require\s*\(\s*['"]fs['"]\s*\)/,
  /require\s*\(\s*['"]net['"]\s*\)/,
  /require\s*\(\s*['"]http['"]\s*\)/,
  /require\s*\(\s*['"]https['"]\s*\)/,
  /process\.exit/,
  /process\.kill/,
  /process\.env/,
  /eval\s*\(/,
  /Function\s*\(/,
  /import\s*\(/,
  /exec\s*\(/,
  /execSync/,
  /spawn\s*\(/,
  /rm\s+-rf/,
  /\.env/,
  /__dirname/,
  /__filename/,
];

/**
 * Check if code contains any blocked patterns
 */
function containsBlockedPattern(code: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      return `Blocked pattern detected: ${pattern.source}`;
    }
  }
  return null;
}

/**
 * Execute JavaScript code in a sandboxed environment
 * 
 * NOTE: This is a basic sandbox using Function constructor with limited scope.
 * For production, use isolated-vm, Deno subprocess, or Docker container.
 */
async function executeCode(args: Record<string, unknown>): Promise<{
  output: string;
  status: 'success' | 'error' | 'timeout';
  executionTimeMs: number;
  metadata?: Record<string, unknown>;
}> {
  const { code, language, timeout } = args as z.infer<typeof CodeExecParams>;

  // ── Security check ──
  const blocked = containsBlockedPattern(code);
  if (blocked) {
    return {
      output: `⚠️ Code execution blocked for security: ${blocked}`,
      status: 'error',
      executionTimeMs: 0,
      metadata: { reason: 'security_block' },
    };
  }

  if (language === 'python') {
    return {
      output: '⚠️ Python execution is not yet supported. Please use JavaScript.',
      status: 'error',
      executionTimeMs: 0,
      metadata: { reason: 'unsupported_language' },
    };
  }

  const startTime = Date.now();

  try {
    // Capture console.log output
    const logs: string[] = [];
    const mockConsole = {
      log: (...logArgs: unknown[]) => logs.push(logArgs.map(String).join(' ')),
      error: (...logArgs: unknown[]) => logs.push(`[ERROR] ${logArgs.map(String).join(' ')}`),
      warn: (...logArgs: unknown[]) => logs.push(`[WARN] ${logArgs.map(String).join(' ')}`),
      info: (...logArgs: unknown[]) => logs.push(`[INFO] ${logArgs.map(String).join(' ')}`),
    };

    // Sandboxed execution with limited globals
    const sandboxedFn = new Function(
      'console',
      'Math',
      'Date',
      'JSON',
      'Array',
      'Object',
      'String',
      'Number',
      'Boolean',
      'Map',
      'Set',
      'Promise',
      'setTimeout',
      `
      "use strict";
      ${code}
      `
    );

    // Execute with timeout
    const result = await Promise.race([
      (async () => {
        const returnValue = sandboxedFn(
          mockConsole,
          Math,
          Date,
          JSON,
          Array,
          Object,
          String,
          Number,
          Boolean,
          Map,
          Set,
          Promise,
          undefined // setTimeout blocked
        );
        // Await if it's a promise
        return returnValue instanceof Promise ? await returnValue : returnValue;
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timeout (${timeout}ms)`)), timeout)
      ),
    ]);

    const executionTimeMs = Date.now() - startTime;
    const consoleOutput = logs.join('\n');
    const returnOutput = result !== undefined ? `\nReturn value: ${JSON.stringify(result, null, 2)}` : '';

    return {
      output: `${consoleOutput}${returnOutput}`.trim() || '(no output)',
      status: 'success',
      executionTimeMs,
      metadata: { language, linesOfCode: code.split('\n').length },
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = (error as Error).message;

    log.warn({ error: errorMessage, duration: executionTimeMs }, 'Code execution error');

    return {
      output: `❌ Execution Error: ${errorMessage}`,
      status: errorMessage.includes('timeout') ? 'timeout' : 'error',
      executionTimeMs,
      metadata: { language, errorType: (error as Error).name },
    };
  }
}

/**
 * Register the code execution tool
 */
export function registerCodeExecTool(): void {
  toolRegistry.register({
    name: 'code_interpreter',
    description: 'Execute JavaScript code in a sandboxed environment. Can perform calculations, data transformations, algorithm testing, and more. Console output and return values are captured.',
    category: 'code',
    parameters: CodeExecParams,
    execute: executeCode,
    enabled: true,
  });

  log.info('Code execution tool registered');
}

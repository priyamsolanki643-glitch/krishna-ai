// ─────────────────────────────────────────────────────────────────
// Circuit Breaker + Dead-Loop Watchdog
// Tracks pipeline execution and kills runaway agent loops.
// Implements Netflix Hystrix-style circuit breaking for AI agents.
// ─────────────────────────────────────────────────────────────────

export interface WatchdogConfig {
  maxRounds: number;           // Max debate rounds allowed
  maxTokenBudget: number;      // Max total tokens for the pipeline
  maxDurationMs: number;       // Max wall-clock time in ms
  maxToolCallsPerAgent: number; // Detect tool call loops
}

export interface WatchdogState {
  queryId: string;
  startTime: number;
  roundCount: number;
  totalTokens: number;
  toolCallHistory: Map<string, string[]>; // agentName → [call signatures]
  isTripped: boolean;
  tripReason?: string;
}

export interface WatchdogCheckResult {
  allowed: boolean;
  reason?: string;
  stats: {
    roundCount: number;
    totalTokens: number;
    elapsedMs: number;
  };
}

const DEFAULT_CONFIG: WatchdogConfig = {
  maxRounds: 3,
  maxTokenBudget: 25000,
  maxDurationMs: 120_000, // 2 minutes
  maxToolCallsPerAgent: 5,
};

export class PipelineWatchdog {
  private state: WatchdogState;
  private config: WatchdogConfig;

  constructor(queryId: string, config?: Partial<WatchdogConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      queryId,
      startTime: Date.now(),
      roundCount: 0,
      totalTokens: 0,
      toolCallHistory: new Map(),
      isTripped: false,
    };
  }

  recordRound(): WatchdogCheckResult {
    this.state.roundCount++;
    return this.check("round");
  }

  recordTokens(count: number): WatchdogCheckResult {
    this.state.totalTokens += count;
    return this.check("tokens");
  }

  recordToolCall(agentName: string, callSignature: string): WatchdogCheckResult {
    const history = this.state.toolCallHistory.get(agentName) ?? [];
    // Detect if same call is being made repeatedly (loop detection)
    const duplicates = history.filter(h => h === callSignature).length;
    if (duplicates >= 2) {
      this.trip(`Agent "${agentName}" is looping — same tool call repeated ${duplicates + 1} times: "${callSignature}"`);
    }
    history.push(callSignature);
    this.state.toolCallHistory.set(agentName, history);
    return this.check("toolcall");
  }

  check(_trigger?: string): WatchdogCheckResult {
    const elapsedMs = Date.now() - this.state.startTime;
    const stats = {
      roundCount: this.state.roundCount,
      totalTokens: this.state.totalTokens,
      elapsedMs,
    };

    if (this.state.isTripped) {
      return { allowed: false, reason: this.state.tripReason, stats };
    }

    if (this.state.roundCount > this.config.maxRounds) {
      this.trip(`Max rounds exceeded: ${this.state.roundCount}/${this.config.maxRounds}`);
      return { allowed: false, reason: this.state.tripReason, stats };
    }

    if (this.state.totalTokens > this.config.maxTokenBudget) {
      this.trip(`Token budget exceeded: ${this.state.totalTokens}/${this.config.maxTokenBudget}`);
      return { allowed: false, reason: this.state.tripReason, stats };
    }

    if (elapsedMs > this.config.maxDurationMs) {
      this.trip(`Time limit exceeded: ${Math.round(elapsedMs / 1000)}s / ${this.config.maxDurationMs / 1000}s`);
      return { allowed: false, reason: this.state.tripReason, stats };
    }

    return { allowed: true, stats };
  }

  private trip(reason: string): void {
    this.state.isTripped = true;
    this.state.tripReason = `[CIRCUIT_BREAKER_TRIPPED] ${reason}`;
    console.warn(`[Watchdog] ⚡ Circuit breaker tripped for query ${this.state.queryId}: ${reason}`);
  }

  getStats() {
    return {
      queryId: this.state.queryId,
      elapsedMs: Date.now() - this.state.startTime,
      roundCount: this.state.roundCount,
      totalTokens: this.state.totalTokens,
      isTripped: this.state.isTripped,
      tripReason: this.state.tripReason,
    };
  }

  isAlive(): boolean {
    return !this.state.isTripped;
  }
}

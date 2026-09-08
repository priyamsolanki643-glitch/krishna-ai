// ─────────────────────────────────────────────────────────────────
// Live Agent Telemetry — Observability Stream
// Emits structured events for every pipeline stage.
// Frontend can consume this via SSE for a real-time dashboard.
// ─────────────────────────────────────────────────────────────────

export type TelemetryEventType =
  | "pipeline_start"
  | "stage_begin"
  | "stage_end"
  | "agent_start"
  | "agent_end"
  | "agent_warning"
  | "verification_result"
  | "watchdog_check"
  | "debate_round"
  | "memory_hit"
  | "circuit_breaker_tripped"
  | "degraded_mode"
  | "pipeline_end";

export interface TelemetryEvent {
  event: TelemetryEventType;
  queryId: string;
  timestamp: number;
  elapsedMs: number;
  stage?: string;
  agent?: string;
  data?: Record<string, unknown>;
}

export class TelemetryEmitter {
  private queryId: string;
  private startTime: number;
  private events: TelemetryEvent[] = [];
  private streamCallback?: (event: TelemetryEvent) => Promise<void>;

  constructor(queryId: string, streamCallback?: (event: TelemetryEvent) => Promise<void>) {
    this.queryId = queryId;
    this.startTime = Date.now();
    this.streamCallback = streamCallback;
  }

  private async emit(
    type: TelemetryEventType,
    data?: Record<string, unknown>,
    agent?: string,
    stage?: string
  ): Promise<void> {
    const event: TelemetryEvent = {
      event: type,
      queryId: this.queryId,
      timestamp: Date.now(),
      elapsedMs: Date.now() - this.startTime,
      stage,
      agent,
      data,
    };
    this.events.push(event);
    if (this.streamCallback) {
      await this.streamCallback(event).catch(console.error);
    }
  }

  async pipelineStart(query: string, isComplex: boolean) {
    await this.emit("pipeline_start", { query: query.slice(0, 100), isComplex });
  }

  async stageBegin(stage: string) {
    await this.emit("stage_begin", { stage }, undefined, stage);
  }

  async stageEnd(stage: string, tokensUsed?: number) {
    await this.emit("stage_end", { stage, tokensUsed }, undefined, stage);
  }

  async agentStart(agentName: string, temperature: number) {
    await this.emit("agent_start", { temperature }, agentName);
  }

  async agentEnd(agentName: string, confidence: number, tokensUsed?: number) {
    await this.emit("agent_end", { confidence, tokensUsed }, agentName);
  }

  async agentWarning(agentName: string, warning: string) {
    await this.emit("agent_warning", { warning }, agentName);
  }

  async verificationResult(agent: string, passed: boolean, reason?: string) {
    await this.emit("verification_result", { passed, reason }, agent);
  }

  async watchdogCheck(stats: Record<string, unknown>, tripped: boolean, reason?: string) {
    await this.emit("watchdog_check", { ...stats, tripped, reason });
  }

  async circuitBreakerTripped(reason: string) {
    await this.emit("circuit_breaker_tripped", { reason });
  }

  async degradedMode(activeAgents: string[], missingAgents: string[]) {
    await this.emit("degraded_mode", { activeAgents, missingAgents });
  }

  async memoryHit(types: string[], episodeCount: number) {
    await this.emit("memory_hit", { types, episodeCount });
  }

  async debateRound(round: number, challenger: string, defender: string) {
    await this.emit("debate_round", { round, challenger, defender });
  }

  async pipelineEnd(success: boolean, totalTokens?: number, finalConfidence?: number) {
    await this.emit("pipeline_end", {
      success,
      totalTokens,
      finalConfidence,
      totalElapsedMs: Date.now() - this.startTime,
    });
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  getSummary() {
    return {
      queryId: this.queryId,
      totalEvents: this.events.length,
      totalElapsedMs: Date.now() - this.startTime,
      stages: [...new Set(this.events.map(e => e.stage).filter(Boolean))],
      agents: [...new Set(this.events.map(e => e.agent).filter(Boolean))],
    };
  }
}

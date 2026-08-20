import { createActor } from "xstate";
import { debateMachine } from "../machines/debateLoop.js";
import { withSpan } from "../lib/telemetry.js";

export type DebateProgressCallback = (event: {
  stage: "lead_drafting" | "reviewer_critiquing" | "round_complete" | "helper_researching";
  round: number;
  data?: any;
}) => Promise<void>;

export interface DebateResult {
  finalDraft: string;
  rounds: number;
  stopReason: "approved" | "converged" | "max_rounds_hit" | "agent_failure_circuit_breaker" | null;
  leadConfidenceHistory: number[];
  is_mock: boolean;
}

export async function runDebateLoop(
  query: string,
  toneInstruction?: string,
  onProgress?: DebateProgressCallback
): Promise<DebateResult> {
  return withSpan("runDebateLoop", { query }, async () => {
    const actor = createActor(debateMachine, {
      input: { query, toneInstruction, onProgress }
    });
    
    actor.start();
    
    await new Promise<void>((resolve) => {
      actor.subscribe((state) => {
        if (state.status === 'done') {
          resolve();
        }
      });
    });

    const finalState = actor.getSnapshot();
    
    return {
      finalDraft: finalState.context.currentDraftContent,
      rounds: finalState.context.round,
      stopReason: finalState.context.stopReason as any,
      leadConfidenceHistory: finalState.context.leadConfidenceHistory,
      is_mock: finalState.context.isMockExecution,
    };
  });
}

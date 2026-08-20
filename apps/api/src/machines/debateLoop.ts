import { setup, assign, fromPromise } from "xstate";
import { runLead } from "../pipeline/draft.js";
import { runReviewer } from "../pipeline/review.js";
import type { DebateResult, DebateProgressCallback } from "../pipeline/loop.js";

interface DebateContext {
  query: string;
  toneInstruction?: string;
  onProgress?: DebateProgressCallback;
  
  round: number;
  leadConfidenceHistory: number[];
  currentDraftContent: string;
  previousCritiqueSummary: string;
  isMockExecution: boolean;
  stopReason: "approved" | "converged" | "max_rounds_hit" | "agent_failure_circuit_breaker" | null;
  leadFailures: number;
  reviewerFailures: number;
}

const MAX_ROUNDS = 5;
const CONVERGENCE_EPSILON = 0.05;

export const debateMachine = setup({
  types: {
    context: {} as DebateContext,
    input: {} as { query: string; toneInstruction?: string; onProgress?: DebateProgressCallback },
  },
  actors: {
    invokeLead: fromPromise(
      async ({ input }: { input: { query: string; previousCritiqueSummary: string; toneInstruction?: string; onProgress?: DebateProgressCallback; round: number } }) => {
        if (input.onProgress) {
          await input.onProgress({ stage: "lead_drafting", round: input.round });
        }
        const draft = await runLead(input.query, input.previousCritiqueSummary, input.toneInstruction);
        return draft;
      }
    ),
    invokeReviewer: fromPromise(
      async ({ input }: { input: { query: string; draftContent: string; toneInstruction?: string; onProgress?: DebateProgressCallback; round: number; draftConfidence: number } }) => {
        if (input.onProgress) {
          await input.onProgress({
            stage: "reviewer_critiquing",
            round: input.round,
            data: { leadDraftConfidence: input.draftConfidence },
          });
        }
        const critique = await runReviewer(input.query, input.draftContent, input.toneInstruction);
        if (input.onProgress) {
          await input.onProgress({
            stage: "round_complete",
            round: input.round,
            data: {
              verdict: critique.verdict,
              reviewerCertainty: critique.confidence,
              leadDraftConfidence: input.draftConfidence,
            },
          });
        }
        return critique;
      }
    ),
  },
  guards: {
    isApproved: ({ event }) => (event as any).output.verdict === "approve",
    hasConverged: ({ context }) => {
      if (context.round < 2) return false;
      const prevConfidence = context.leadConfidenceHistory[context.round - 2];
      const currentConfidence = context.leadConfidenceHistory[context.round - 1];
      const delta = Math.abs(currentConfidence - prevConfidence);
      return delta < CONVERGENCE_EPSILON;
    },
    isMaxRoundsHit: ({ context }) => context.round >= MAX_ROUNDS,
    leadCircuitBroken: ({ context }) => context.leadFailures >= 1,
    reviewerCircuitBroken: ({ context }) => context.reviewerFailures >= 1,
  }
}).createMachine({
  id: "debateLoop",
  initial: "drafting",
  context: ({ input }) => ({
    query: input.query,
    toneInstruction: input.toneInstruction,
    onProgress: input.onProgress,
    round: 1,
    leadConfidenceHistory: [],
    currentDraftContent: "",
    previousCritiqueSummary: "",
    isMockExecution: false,
    stopReason: null,
    leadFailures: 0,
    reviewerFailures: 0,
  }),
  states: {
    drafting: {
      invoke: {
        src: "invokeLead",
        input: ({ context }) => ({
          query: context.query,
          previousCritiqueSummary: context.previousCritiqueSummary,
          toneInstruction: context.toneInstruction,
          onProgress: context.onProgress,
          round: context.round,
        }),
        onDone: {
          target: "reviewing",
          actions: assign({
            currentDraftContent: ({ event }) => event.output.content,
            leadConfidenceHistory: ({ context, event }) => [...context.leadConfidenceHistory, event.output.confidence],
            isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
            leadFailures: 0, // Reset on success
          })
        },
        onError: [
          {
            guard: "leadCircuitBroken",
            target: "aborted",
            actions: assign({
              stopReason: "agent_failure_circuit_breaker",
            })
          },
          {
            target: "drafting",
            reenter: true,
            actions: assign({
              leadFailures: ({ context }) => context.leadFailures + 1
            })
          }
        ]
      }
    },
    reviewing: {
      invoke: {
        src: "invokeReviewer",
        input: ({ context }) => ({
          query: context.query,
          draftContent: context.currentDraftContent,
          toneInstruction: context.toneInstruction,
          onProgress: context.onProgress,
          round: context.round,
          draftConfidence: context.leadConfidenceHistory[context.round - 1],
        }),
        onDone: [
          {
            guard: "isApproved",
            target: "done",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              stopReason: "approved",
              reviewerFailures: 0
            })
          },
          {
            guard: "hasConverged",
            target: "done",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              stopReason: "converged",
              reviewerFailures: 0
            })
          },
          {
            guard: "isMaxRoundsHit",
            target: "done",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              stopReason: "max_rounds_hit",
              reviewerFailures: 0
            })
          },
          {
            target: "drafting",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              previousCritiqueSummary: ({ event }) => `Issue: ${event.output.issue}\nEvidence: ${event.output.evidence}\nSuggested Fix: ${event.output.suggested_fix}`,
              round: ({ context }) => context.round + 1,
              reviewerFailures: 0
            })
          }
        ],
        onError: [
          {
            guard: "reviewerCircuitBroken",
            target: "aborted",
            actions: assign({
              stopReason: "agent_failure_circuit_breaker",
            })
          },
          {
            target: "reviewing",
            reenter: true,
            actions: assign({
              reviewerFailures: ({ context }) => context.reviewerFailures + 1
            })
          }
        ]
      }
    },
    aborted: {
      type: "final"
    },
    done: {
      type: "final"
    }
  }
});

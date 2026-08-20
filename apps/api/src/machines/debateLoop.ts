import { setup, assign, fromPromise } from "xstate";
import { runLead } from "../pipeline/draft.js";
import { runReviewer } from "../pipeline/review.js";
import { runHelper } from "../pipeline/helper.js";
import { validateSpawnRequest } from "../lib/planValidator.js";
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
  spawnsCount: number;
  currentHelpQuery: string;
  helperContext: string;
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
    invokeHelper: fromPromise(
      async ({ input }: { input: { helpQuery: string; domain: string; onProgress?: DebateProgressCallback; round: number } }) => {
        if (input.onProgress) {
          await input.onProgress({
            stage: "helper_researching",
            round: input.round,
            data: { helpQuery: input.helpQuery },
          } as any);
        }
        const helperResult = await runHelper(input.helpQuery, input.domain);
        return helperResult;
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
    needsHelp: ({ event }) => (event as any).output.needs_help === true,
    isSpawnAllowed: ({ context }) => validateSpawnRequest(context.spawnsCount).allowed,
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
    spawnsCount: 0,
    currentHelpQuery: "",
    helperContext: "",
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
          helperContext: context.helperContext,
        }),
        onDone: [
          {
            guard: "needsHelp",
            target: "requesting_spawn",
            actions: assign({
              currentDraftContent: ({ event }) => event.output.content,
              leadConfidenceHistory: ({ context, event }) => [...context.leadConfidenceHistory, event.output.confidence],
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              leadFailures: 0,
              currentHelpQuery: ({ event }) => event.output.help_query || "General stuck context",
            })
          },
          {
            target: "reviewing",
            actions: assign({
              currentDraftContent: ({ event }) => event.output.content,
              leadConfidenceHistory: ({ context, event }) => [...context.leadConfidenceHistory, event.output.confidence],
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              leadFailures: 0,
            })
          }
        ],
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
    requesting_spawn: {
      always: [
        {
          guard: "isSpawnAllowed",
          target: "spawning_helper"
        },
        {
          target: "reviewing" // If denied, proceed to review with whatever draft we got
        }
      ]
    },
    spawning_helper: {
      entry: assign({ spawnsCount: ({ context }) => context.spawnsCount + 1 }),
      invoke: {
        src: "invokeHelper",
        input: ({ context }) => ({
          helpQuery: context.currentHelpQuery,
          domain: "coding", // Defaulting for now, can be extracted from Supervisor later
          onProgress: context.onProgress,
          round: context.round,
        }),
        onDone: {
          target: "drafting",
          actions: assign({
            helperContext: ({ context, event }) => context.helperContext + "\n\n" + event.output.result,
            isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
          })
        },
        onError: {
          target: "drafting", // On error, just go back to drafting, don't break the whole loop
        }
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

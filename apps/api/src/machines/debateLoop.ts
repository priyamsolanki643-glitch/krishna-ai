import { setup, assign, fromPromise } from "xstate";
import { runLead } from "../pipeline/draft.js";
import { runReviewer } from "../pipeline/review.js";
import { runHelper } from "../pipeline/helper.js";
import { runCritic } from "../pipeline/critic.js";
import { validateSpawnRequest } from "../lib/planValidator.js";
import type { DebateResult, DebateProgressCallback } from "../pipeline/loop.js";

interface DebateContext {
  query: string;
  toneInstruction?: string;
  onProgress?: DebateProgressCallback;
  leadModel?: string;
  reviewerModel?: string;
  maxRounds: number;
  userGroqKey?: string;
  
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

  // Critic pushback context
  criticFlagged: boolean;
  criticRetries: number;
  criticObjection: string;
}

const CONVERGENCE_EPSILON = 0.05;

export const debateMachine = setup({
  types: {
    context: {} as DebateContext,
    input: {} as { 
      query: string; 
      toneInstruction?: string; 
      onProgress?: DebateProgressCallback;
      leadModel?: string;
      reviewerModel?: string;
      maxRounds?: number;
      userGroqKey?: string;
    },
  },
  actors: {
    invokeLead: fromPromise(
      async ({ input }: { input: { query: string; previousCritiqueSummary: string; toneInstruction?: string; onProgress?: DebateProgressCallback; round: number; helperContext?: string; modelOverride?: string; userGroqKey?: string } }) => {
        if (input.onProgress) {
          await input.onProgress({ stage: "lead_drafting", round: input.round });
        }
        const draft = await runLead(input.query, input.previousCritiqueSummary, input.toneInstruction, input.helperContext, input.modelOverride, input.userGroqKey);
        return draft;
      }
    ),
    invokeReviewer: fromPromise(
      async ({ input }: { input: { query: string; draftContent: string; toneInstruction?: string; onProgress?: DebateProgressCallback; round: number; draftConfidence: number; modelOverride?: string; userGroqKey?: string } }) => {
        if (input.onProgress) {
          await input.onProgress({
            stage: "reviewer_critiquing",
            round: input.round,
            data: { leadDraftConfidence: input.draftConfidence },
          });
        }
        const critique = await runReviewer(input.query, input.draftContent, input.toneInstruction, input.modelOverride, input.userGroqKey);
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
    invokeCritic: fromPromise(
      async ({ input }: { input: { query: string; finalDraft: string; onProgress?: DebateProgressCallback; round: number; userGroqKey?: string } }) => {
        if (input.onProgress) {
          await input.onProgress({
            stage: "critic_reviewing",
            round: input.round,
          } as any);
        }
        const criticResult = await runCritic(input.query, input.finalDraft, input.userGroqKey);
        return criticResult;
      }
    ),
    invokeCriticRevisionLead: fromPromise(
      async ({ input }: { input: { query: string; objection: string; toneInstruction?: string; onProgress?: DebateProgressCallback; round: number; modelOverride?: string; userGroqKey?: string } }) => {
        if (input.onProgress) {
          await input.onProgress({
            stage: "critic_revising",
            round: input.round,
            data: { objection: input.objection }
          } as any);
        }
        const critiqueFeedback = `ADVERSARIAL CRITIC OBJECTION (Address this flaw directly):\n${input.objection}`;
        const draft = await runLead(input.query, critiqueFeedback, input.toneInstruction, undefined, input.modelOverride, input.userGroqKey);
        return draft;
      }
    )
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
    isMaxRoundsHit: ({ context }) => context.round >= context.maxRounds,
    leadCircuitBroken: ({ context }) => context.leadFailures >= 1,
    reviewerCircuitBroken: ({ context }) => context.reviewerFailures >= 1,
    needsHelp: ({ event }) => (event as any).output.needs_help === true,
    isSpawnAllowed: ({ context }) => validateSpawnRequest(context.spawnsCount).allowed,
    isCriticApproved: ({ event }) => (event as any).output.verdict === "approve",
    canRetryCritic: ({ context }) => context.criticRetries < 1,
  }
}).createMachine({
  id: "debateLoop",
  initial: "drafting",
  context: ({ input }) => ({
    query: input.query,
    toneInstruction: input.toneInstruction,
    onProgress: input.onProgress,
    leadModel: input.leadModel,
    reviewerModel: input.reviewerModel,
    maxRounds: input.maxRounds || 5,
    userGroqKey: input.userGroqKey,
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
    criticFlagged: false,
    criticRetries: 0,
    criticObjection: "",
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
          modelOverride: context.leadModel,
          userGroqKey: context.userGroqKey,
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
          target: "reviewing"
        }
      ]
    },
    spawning_helper: {
      entry: assign({ spawnsCount: ({ context }) => context.spawnsCount + 1 }),
      invoke: {
        src: "invokeHelper",
        input: ({ context }) => ({
          helpQuery: context.currentHelpQuery,
          domain: "coding",
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
          target: "drafting",
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
          modelOverride: context.reviewerModel,
          userGroqKey: context.userGroqKey,
        }),
        onDone: [
          {
            guard: "isApproved",
            target: "critic_review",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              stopReason: "approved",
              reviewerFailures: 0
            })
          },
          {
            guard: "hasConverged",
            target: "critic_review",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              stopReason: "converged",
              reviewerFailures: 0
            })
          },
          {
            guard: "isMaxRoundsHit",
            target: "critic_review",
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
    critic_review: {
      invoke: {
        src: "invokeCritic",
        input: ({ context }) => ({
          query: context.query,
          finalDraft: context.currentDraftContent,
          onProgress: context.onProgress,
          round: context.round,
          userGroqKey: context.userGroqKey,
        }),
        onDone: [
          {
            guard: "isCriticApproved",
            target: "done",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
            })
          },
          {
            guard: "canRetryCritic",
            target: "critic_revision",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              criticFlagged: true,
              criticObjection: ({ event }) => event.output.objection,
              criticRetries: ({ context }) => context.criticRetries + 1,
            })
          },
          {
            target: "done",
            actions: assign({
              isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
              criticFlagged: true,
            })
          }
        ],
        onError: {
          target: "done",
        }
      }
    },
    critic_revision: {
      invoke: {
        src: "invokeCriticRevisionLead",
        input: ({ context }) => ({
          query: context.query,
          objection: context.criticObjection,
          toneInstruction: context.toneInstruction,
          onProgress: context.onProgress,
          round: context.round,
          modelOverride: context.leadModel,
          userGroqKey: context.userGroqKey,
        }),
        onDone: {
          target: "done",
          actions: assign({
            currentDraftContent: ({ event }) => event.output.content,
            isMockExecution: ({ context, event }) => context.isMockExecution || event.output.is_mock,
            criticFlagged: true,
          })
        },
        onError: {
          target: "done",
          actions: assign({
            criticFlagged: true,
          })
        }
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

import { runLead } from "./draft.js";
import { runReviewer } from "./review.js";

export interface DebateResult {
  finalDraft: string;
  rounds: number;
  stopReason: "approved" | "converged" | "max_rounds_hit";
  confidenceHistory: number[];
}

export type DebateProgressCallback = (event: {
  stage: "lead_drafting" | "reviewer_critiquing" | "round_complete";
  round: number;
  data?: any;
}) => Promise<void>;

export async function runDebateLoop(
  query: string,
  toneInstruction?: string,
  onProgress?: DebateProgressCallback
): Promise<DebateResult> {
  const MAX_ROUNDS = 5;
  const confidenceHistory: number[] = [];
  let currentDraftContent = "";
  let previousCritiqueSummary = "";

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    if (onProgress) {
      await onProgress({ stage: "lead_drafting", round });
    }

    // 1. Lead Agent drafts or revises
    const draft = await runLead(query, previousCritiqueSummary, toneInstruction);
    currentDraftContent = draft.content;
    confidenceHistory.push(draft.confidence);

    if (onProgress) {
      await onProgress({ stage: "reviewer_critiquing", round, data: { draftConfidence: draft.confidence } });
    }

    // 2. Reviewer Agent critiques
    const critique = await runReviewer(query, currentDraftContent, toneInstruction);

    if (onProgress) {
      await onProgress({
        stage: "round_complete",
        round,
        data: { verdict: critique.verdict, confidence: critique.confidence },
      });
    }

    // 3. Verdict: Approved
    if (critique.verdict === "approve") {
      return {
        finalDraft: currentDraftContent,
        rounds: round,
        stopReason: "approved",
        confidenceHistory,
      };
    }

    // 4. Check Convergence: Delta between consecutive confidence scores < 0.05
    if (round > 1) {
      const prevConfidence = confidenceHistory[round - 2];
      const currentConfidence = confidenceHistory[round - 1];
      const delta = Math.abs(currentConfidence - prevConfidence);

      if (delta < 0.05) {
        return {
          finalDraft: currentDraftContent,
          rounds: round,
          stopReason: "converged",
          confidenceHistory,
        };
      }
    }

    // 5. Prepare critique context for next round
    previousCritiqueSummary = `Issue: ${critique.issue}\nEvidence: ${critique.evidence}\nSuggested Fix: ${critique.suggested_fix}`;
  }

  // 6. Max rounds hard ceiling hit
  return {
    finalDraft: currentDraftContent,
    rounds: MAX_ROUNDS,
    stopReason: "max_rounds_hit",
    confidenceHistory,
  };
}

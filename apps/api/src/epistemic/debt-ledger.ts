import { z } from "zod";

export interface DebtLedgerEntry {
  agentId: string;
  claimId: string;
  claimContent: string;
  localConfidence: number;
  deficit: number; // 1 - confidence
}

export interface EpistemicDebtLedger {
  entries: DebtLedgerEntry[];
  jointConfidence: number;
  criticalAssumptionId: string | null;
}

export function initializeDebtLedger(): EpistemicDebtLedger {
  return { entries: [], jointConfidence: 1.0, criticalAssumptionId: null };
}

export function addClaimToLedger(
  ledger: EpistemicDebtLedger,
  agentId: string,
  claimContent: string,
  confidence: number
): EpistemicDebtLedger {
  const safeConfidence = Math.max(0.1, Math.min(1.0, confidence));
  const newEntry: DebtLedgerEntry = {
    agentId,
    claimId: `claim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    claimContent,
    localConfidence: safeConfidence,
    deficit: 1 - safeConfidence,
  };

  const newEntries = [...ledger.entries, newEntry];
  
  // Compounding Bayesian joint probability (assuming sequential dependence)
  const newJointConfidence = newEntries.reduce((acc, entry) => acc * entry.localConfidence, 1.0);
  
  // Find the single claim with highest epistemic deficit
  let criticalAssumptionId = null;
  let maxDeficit = 0;
  for (const entry of newEntries) {
    if (entry.deficit > maxDeficit) {
      maxDeficit = entry.deficit;
      criticalAssumptionId = entry.claimId;
    }
  }

  return {
    entries: newEntries,
    jointConfidence: newJointConfidence,
    criticalAssumptionId,
  };
}

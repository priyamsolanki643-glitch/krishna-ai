import { z } from "zod";

/**
 * Epistemic Debt Ledger
 *
 * NOTE ON CORRELATED PROBABILITY MODELING:
 * In a multi-agent system powered by a single model family (e.g., Gemini Flash),
 * reasoning chains are NOT strictly independent; agents share base distributions and biases.
 * 
 * Naive multiplication \prod P(c_i) assumes strict conditional independence, leading to
 * artificially deflated joint confidences. Conversely, naive min P(c_i) assumes complete correlation.
 * 
 * We employ a correlation-adjusted mixture:
 *   P(joint) = (1 - \rho) * (\prod P(c_i)) + \rho * (min P(c_i))
 * where \rho represents the intra-model correlation factor (default: 0.35).
 */

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
  correlationFactor: number;
}

export function initializeDebtLedger(correlationFactor: number = 0.35): EpistemicDebtLedger {
  return { 
    entries: [], 
    jointConfidence: 1.0, 
    criticalAssumptionId: null,
    correlationFactor: Math.max(0, Math.min(1, correlationFactor))
  };
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
  
  // Independent product component
  const independentProduct = newEntries.reduce((acc, entry) => acc * entry.localConfidence, 1.0);
  
  // Minimum confidence component (Fréchet upper bound under positive dependence)
  const minConfidence = newEntries.reduce((min, entry) => Math.min(min, entry.localConfidence), 1.0);
  
  // Correlation-adjusted joint confidence
  const rho = ledger.correlationFactor;
  const newJointConfidence = (1 - rho) * independentProduct + rho * minConfidence;
  
  // Find the single claim with highest epistemic deficit (critical weak point)
  let criticalAssumptionId: string | null = null;
  let maxDeficit = 0;
  for (const entry of newEntries) {
    if (entry.deficit > maxDeficit) {
      maxDeficit = entry.deficit;
      criticalAssumptionId = entry.claimId;
    }
  }

  return {
    entries: newEntries,
    jointConfidence: Math.max(0.05, Math.min(1.0, newJointConfidence)),
    criticalAssumptionId,
    correlationFactor: rho,
  };
}

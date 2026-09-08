import type { AgentResult } from "../agents/skeptic.js";
import type { SAPMessage } from "../schemas/sap.js";

// ─────────────────────────────────────────────────────────────────
// Confidence Collapse Detector (Verifier Node)
// Runs between every agent output and the next pipeline stage.
// Prevents cascading hallucinations by catching low-confidence
// or internally inconsistent outputs BEFORE they propagate.
// ─────────────────────────────────────────────────────────────────

export interface VerificationResult {
  passed: boolean;
  agent: string;
  confidence: number;
  reason?: string;
  flagged_claim?: string;
}

export interface PipelineVerdict {
  allPassed: boolean;
  results: VerificationResult[];
  halted: boolean;
  haltReason?: string;
  safeOutputs: AgentResult[];
}

const CONFIDENCE_THRESHOLD = 0.35; // Below this → reject agent output
const CONSISTENCY_MARKERS = [
  // Internal contradiction signals — if both of these appear in same output
  { a: "always", b: "never" },
  { a: "impossible", b: "definitely" },
  { a: "certain", b: "uncertain" },
];

function detectInternalContradiction(text: string): string | null {
  const lower = text.toLowerCase();
  for (const pair of CONSISTENCY_MARKERS) {
    if (lower.includes(pair.a) && lower.includes(pair.b)) {
      return `Contradictory signals detected: "${pair.a}" vs "${pair.b}"`;
    }
  }
  return null;
}

function detectEmptyOrRefusal(text: string): boolean {
  const stripped = text.trim().toLowerCase();
  const refusalPhrases = [
    "i cannot", "i can't", "i am unable", "i don't know",
    "no information", "not enough context",
  ];
  if (stripped.length < 30) return true;
  return refusalPhrases.some(p => stripped.startsWith(p));
}

export function verifyAgentOutput(agent: AgentResult): VerificationResult {
  // Check 1: Confidence threshold
  if (agent.confidence < CONFIDENCE_THRESHOLD) {
    return {
      passed: false,
      agent: agent.agent,
      confidence: agent.confidence,
      reason: `Confidence ${agent.confidence.toFixed(2)} is below threshold ${CONFIDENCE_THRESHOLD}`,
    };
  }

  // Check 2: Empty output or explicit refusal
  if (detectEmptyOrRefusal(agent.output)) {
    return {
      passed: false,
      agent: agent.agent,
      confidence: agent.confidence,
      reason: "Agent output is empty, too short, or a refusal",
    };
  }

  // Check 3: Internal contradiction detection
  const contradiction = detectInternalContradiction(agent.output);
  if (contradiction) {
    return {
      passed: false,
      agent: agent.agent,
      confidence: agent.confidence,
      reason: contradiction,
      flagged_claim: contradiction,
    };
  }

  return { passed: true, agent: agent.agent, confidence: agent.confidence };
}

export function runPipelineVerifier(
  agentOutputs: AgentResult[],
  options?: { haltOnFirstFailure?: boolean; minPassingAgents?: number }
): PipelineVerdict {
  const results: VerificationResult[] = agentOutputs.map(verifyAgentOutput);
  const safeOutputs = agentOutputs.filter((_, i) => results[i].passed);
  const failedResults = results.filter(r => !r.passed);

  const minPassing = options?.minPassingAgents ?? 1;
  const haltOnFirst = options?.haltOnFirstFailure ?? false;

  if (haltOnFirst && failedResults.length > 0) {
    return {
      allPassed: false,
      results,
      halted: true,
      haltReason: `Agent "${failedResults[0].agent}" failed verification: ${failedResults[0].reason}`,
      safeOutputs,
    };
  }

  if (safeOutputs.length < minPassing) {
    return {
      allPassed: false,
      results,
      halted: true,
      haltReason: `Only ${safeOutputs.length}/${agentOutputs.length} agents passed. Minimum required: ${minPassing}`,
      safeOutputs,
    };
  }

  return {
    allPassed: failedResults.length === 0,
    results,
    halted: false,
    safeOutputs,
  };
}

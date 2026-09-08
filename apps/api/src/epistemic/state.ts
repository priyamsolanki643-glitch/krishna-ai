// ─────────────────────────────────────────────────────────────────
// CONCEPT 3: Epistemic State — Claim-Level Uncertainty Mapping
// Each agent exposes WHERE it is uncertain, not just HOW much.
// Synthesizer uses this map for mathematically weighted synthesis.
// ─────────────────────────────────────────────────────────────────

export type EpistemicBasis = "factual" | "inferential" | "speculative" | "unknown";

export interface ClaimEpistemic {
  claim: string;            // The specific claim being made
  confidence: number;       // 0.0-1.0
  basis: EpistemicBasis;    // What grounds this claim
  uncertaintySource?: string; // WHY uncertain (if confidence < 0.6)
}

export interface EpistemicState {
  agentName: string;
  overallConfidence: number;        // Weighted average of claim confidences
  claims: ClaimEpistemic[];         // All claims with individual confidence
  highConfidenceClaims: string[];   // confidence >= 0.75
  lowConfidenceClaims: string[];    // confidence < 0.5
  knownUnknowns: string[];          // Things agent explicitly doesn't know
  epistemicGaps: string[];          // Areas where more info would help
}

export interface EpistemicWeightedInput {
  agentName: string;
  output: string;
  epistemicState: EpistemicState;
  weight: number;  // From PipelineDAG node weight
}

// Parse agent output to extract epistemic signals
// Agents embed structured epistemic markers in their output
export function parseEpistemicMarkers(agentName: string, output: string, overallConfidence: number): EpistemicState {
  const claims: ClaimEpistemic[] = [];
  const highConfidenceClaims: string[] = [];
  const lowConfidenceClaims: string[] = [];
  const knownUnknowns: string[] = [];
  const epistemicGaps: string[] = [];

  // Extract [CLAIM:text|conf:0.9|basis:factual] markers
  const claimRegex = /\[CLAIM:([^|]+)\|conf:([\d.]+)\|basis:(factual|inferential|speculative|unknown)(?:\|why:([^\]]+))?\]/g;
  let match;
  while ((match = claimRegex.exec(output)) !== null) {
    const conf = parseFloat(match[2]);
    const claim: ClaimEpistemic = {
      claim: match[1].trim(),
      confidence: conf,
      basis: match[3] as EpistemicBasis,
      uncertaintySource: match[4]?.trim(),
    };
    claims.push(claim);
    if (conf >= 0.75) highConfidenceClaims.push(claim.claim);
    else if (conf < 0.5) lowConfidenceClaims.push(claim.claim);
  }

  // Extract [UNKNOWN:text] markers
  const unknownRegex = /\[UNKNOWN:([^\]]+)\]/g;
  while ((match = unknownRegex.exec(output)) !== null) {
    knownUnknowns.push(match[1].trim());
  }

  // Extract [GAP:text] markers
  const gapRegex = /\[GAP:([^\]]+)\]/g;
  while ((match = gapRegex.exec(output)) !== null) {
    epistemicGaps.push(match[1].trim());
  }

  // If no structured markers found, derive from overall confidence
  if (claims.length === 0) {
    const sentences = output.split(/[.!?]/).filter(s => s.trim().length > 20);
    sentences.slice(0, 3).forEach(s => {
      claims.push({
        claim: s.trim().slice(0, 100),
        confidence: overallConfidence,
        basis: overallConfidence > 0.75 ? "factual" : "inferential",
      });
    });
    if (overallConfidence >= 0.75) highConfidenceClaims.push(...claims.map(c => c.claim));
    else if (overallConfidence < 0.5) lowConfidenceClaims.push(...claims.map(c => c.claim));
  }

  const weightedAvg = claims.length > 0
    ? claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length
    : overallConfidence;

  return {
    agentName,
    overallConfidence: weightedAvg,
    claims,
    highConfidenceClaims,
    lowConfidenceClaims,
    knownUnknowns,
    epistemicGaps,
  };
}

// Compute epistemic agreement score between two agents (0-1)
export function computeEpistemicAgreement(a: EpistemicState, b: EpistemicState): number {
  if (a.claims.length === 0 || b.claims.length === 0) return 0.5;
  const confDiff = Math.abs(a.overallConfidence - b.overallConfidence);
  const agreement = 1 - confDiff;
  return Math.max(0, Math.min(1, agreement));
}

// Generate epistemic summary for Synthesizer context
export function buildEpistemicContext(states: EpistemicState[]): string {
  const lines: string[] = ["[EPISTEMIC MAP]"];
  for (const s of states) {
    lines.push(`${s.agentName} (overall: ${s.overallConfidence.toFixed(2)}):`);
    if (s.highConfidenceClaims.length > 0) {
      lines.push(`  HIGH confidence: ${s.highConfidenceClaims.slice(0, 2).join("; ")}`);
    }
    if (s.lowConfidenceClaims.length > 0) {
      lines.push(`  LOW confidence: ${s.lowConfidenceClaims.slice(0, 2).join("; ")}`);
    }
    if (s.knownUnknowns.length > 0) {
      lines.push(`  UNKNOWN: ${s.knownUnknowns.slice(0, 2).join("; ")}`);
    }
  }
  return lines.join("\n");
}

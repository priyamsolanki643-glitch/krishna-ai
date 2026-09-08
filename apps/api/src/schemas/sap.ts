import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// Structured Agent Protocol (SAP)
// Agents communicate via typed JSON — NOT English prose.
// This eliminates token waste + inter-agent ambiguity.
// ─────────────────────────────────────────────────────────────────

export const SAPMessageType = z.enum([
  "ANALYSIS",      // Agent provides its core analysis
  "CHALLENGE",     // Agent challenges a specific claim from another
  "DEFENSE",       // Agent defends a challenged claim
  "CONCEDE",       // Agent concedes a point to another
  "SYNTHESIS",     // Synthesizer's final integrated output
  "HALT",          // Emergency stop — critical failure detected
]);

export type SAPMessageType = z.infer<typeof SAPMessageType>;

export const SAPMessage = z.object({
  from: z.string(),                        // Agent name
  to: z.string().optional(),              // Target agent (optional, broadcast if omitted)
  type: SAPMessageType,
  confidence: z.number().min(0).max(1),  // 0.0 → 1.0
  content: z.string(),                    // Core message content (compressed, not prose)
  target_claim: z.string().optional(),   // For CHALLENGE/DEFENSE: which claim is targeted
  evidence: z.string().optional(),        // Supporting evidence or counter-evidence
  source_chain: z.array(z.string()).default([]), // What facts this is based on
  token_count: z.number().optional(),    // Self-reported token usage
  timestamp: z.number().default(() => Date.now()),
});

export type SAPMessage = z.infer<typeof SAPMessage>;

export const SAPEnvelope = z.object({
  query_id: z.string(),
  round: z.number().int().min(1),
  messages: z.array(SAPMessage),
  total_tokens_so_far: z.number().default(0),
  pipeline_stage: z.enum(["analysis", "debate", "synthesis", "halted"]),
});

export type SAPEnvelope = z.infer<typeof SAPEnvelope>;

// Helper to create a typed SAP message
export function createSAPMessage(
  from: string,
  type: SAPMessageType,
  content: string,
  confidence: number,
  opts?: {
    to?: string;
    target_claim?: string;
    evidence?: string;
    source_chain?: string[];
    token_count?: number;
  }
): SAPMessage {
  return SAPMessage.parse({
    from,
    to: opts?.to,
    type,
    confidence: Math.max(0, Math.min(1, confidence)),
    content,
    target_claim: opts?.target_claim,
    evidence: opts?.evidence,
    source_chain: opts?.source_chain ?? [],
    token_count: opts?.token_count,
    timestamp: Date.now(),
  });
}

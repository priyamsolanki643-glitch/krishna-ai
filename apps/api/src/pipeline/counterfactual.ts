import { callGeminiFlash } from "../lib/gemini.js";

/**
 * Counterfactual Consistency Probing
 *
 * NOTE ON METHODOLOGY:
 * This module performs prompt-based counterfactual consistency checking on LLM claims.
 * While inspired by Pearl's conceptual counterfactual ladder, this is NOT a formal mathematical
 * structural causal model (SCM) or graphical do-calculus implementation. It evaluates whether
 * an LLM can identify plausible alternative scenarios where cause X is negated to check
 * if effect Y would still occur, serving as an epistemic stress-test against spurious correlation.
 */

export interface CausalClaim {
  originalText: string;
  cause: string;
  effect: string;
}

export interface CounterfactualTestResult {
  claim: CausalClaim;
  counterfactualScenario: string;
  isGenuinelyCausal: boolean;
  confidence: number;
  reasoning: string;
}

export async function extractCausalClaims(text: string): Promise<CausalClaim[]> {
  const prompt = `Extract causal claims from the following text. 
A causal claim asserts that X causes, leads to, or directly results in Y.
Format as JSON array of objects: { "originalText": "...", "cause": "...", "effect": "..." }
If none, return []. Limit to at most 3 prominent claims.

Text:
${text}`;

  try {
    const response = await callGeminiFlash({
      temperature: 0.1,
      systemPrompt: "You are an epistemic analyst isolating explicit causal assertions.",
      userPrompt: prompt,
      maxTokens: 500
    });
    
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]) as CausalClaim[];
  } catch (e) {
    return [];
  }
}

export async function testCounterfactual(claim: CausalClaim): Promise<CounterfactualTestResult> {
  const prompt = `Conduct a counterfactual consistency probe on the following causal claim:
Stated Cause (X): ${claim.cause}
Stated Effect (Y): ${claim.effect}

Step 1: Construct a plausible counterfactual scenario where X does NOT occur.
Step 2: Reason step-by-step: In that counterfactual world, would Y still happen due to confounding factors or alternative pathways?
Step 3: If Y would still happen regardless of X, the claim is likely correlational or oversimplified. If Y is genuinely contingent on X, classify it as causal.

Return strictly as JSON:
{
  "counterfactualScenario": "Brief description of the world without X",
  "isGenuinelyCausal": true|false,
  "confidence": 0.0-1.0,
  "reasoning": "Explanation of whether the effect persists without the cause"
}`;

  try {
    const response = await callGeminiFlash({
      temperature: 0.2,
      systemPrompt: "You are a Counterfactual Consistency Prober. Stress-test whether claims survive counterfactual negation.",
      userPrompt: prompt,
      maxTokens: 500
    });
    
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("Parse failed");
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      claim,
      counterfactualScenario: parsed.counterfactualScenario || "Scenario generated",
      isGenuinelyCausal: Boolean(parsed.isGenuinelyCausal),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reasoning: parsed.reasoning || "Evaluation complete."
    };
  } catch (e) {
    return {
      claim,
      counterfactualScenario: "Failed to construct counterfactual",
      isGenuinelyCausal: false, // Default fail-safe
      confidence: 0.0,
      reasoning: "System error during counterfactual evaluation."
    };
  }
}

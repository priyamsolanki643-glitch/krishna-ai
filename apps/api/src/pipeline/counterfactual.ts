import { callGeminiFlash } from "../lib/gemini.js";

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
  const prompt = `Extract ALL causal claims from the following text. 
A causal claim asserts that X causes, leads to, or results in Y.
Format as JSON array of objects: { "originalText": "...", "cause": "...", "effect": "..." }
If none, return [].

Text:
${text}`;

  try {
    const response = await callGeminiFlash({
      temperature: 0.1,
      systemPrompt: "You are an epistemic analyst isolating causal claims.",
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
  const prompt = `Apply Judea Pearl's do-calculus intervention logic to test this causal claim.
Cause (X): ${claim.cause}
Effect (Y): ${claim.effect}

Step 1: Construct a plausible counterfactual world where X does NOT occur.
Step 2: Reason step-by-step: In that world, would Y still happen due to other factors?
Step 3: If Y still happens, the claim is correlational (spurious), NOT causal. If Y is prevented, it is genuinely causal.

Return strictly as JSON:
{
  "counterfactualScenario": "...",
  "isGenuinelyCausal": true|false,
  "confidence": 0.0-1.0,
  "reasoning": "..."
}`;

  try {
    const response = await callGeminiFlash({
      temperature: 0.3,
      systemPrompt: "You are Judea Pearl's Counterfactual Engine. Evaluate causality strictly.",
      userPrompt: prompt,
      maxTokens: 500
    });
    
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("Parse failed");
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      claim,
      counterfactualScenario: parsed.counterfactualScenario,
      isGenuinelyCausal: parsed.isGenuinelyCausal,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning
    };
  } catch (e) {
    return {
      claim,
      counterfactualScenario: "Failed to generate counterfactual",
      isGenuinelyCausal: false, // Default fail-safe
      confidence: 0.0,
      reasoning: "System error during counterfactual evaluation."
    };
  }
}

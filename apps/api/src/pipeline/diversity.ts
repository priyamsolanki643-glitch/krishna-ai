import { callGeminiFlash } from "../lib/gemini.js";

/**
 * Attractor State Diversity Maintenance
 *
 * NOTE ON HEURISTIC THRESHOLD:
 * In multi-agent deliberation, agents with shared priors risk converging into
 * superficial consensus ("cognitive attractor state").
 *
 * We monitor semantic divergence as a heuristic defense.
 * IMPORTANT: Forced entropy injection is INTENTIONALLY BYPASSED for factual,
 * formal, or mathematical queries, where convergence on the single true answer
 * is desired behavior and forced divergence would induce artificial hallucinations.
 */

export interface EntropyMetrics {
  currentDiversityScore: number;
  isInAttractorState: boolean;
  requiredEntropyInjection: boolean;
  bypassedReason?: string;
}

export interface DiversityOptions {
  threshold?: number;
  queryType?: string;
}

export async function measureAgentDiversity(
  agentOutputs: string[],
  options?: DiversityOptions
): Promise<EntropyMetrics> {
  const threshold = options?.threshold ?? 0.4;
  const queryType = options?.queryType || "general";

  if (agentOutputs.length < 2) {
    return { currentDiversityScore: 1.0, isInAttractorState: false, requiredEntropyInjection: false };
  }

  // If query is strictly factual or mathematical, convergence is correct — do not force divergence
  if (["factual", "definitional", "math", "code_syntax"].includes(queryType.toLowerCase())) {
    return {
      currentDiversityScore: 1.0,
      isInAttractorState: false,
      requiredEntropyInjection: false,
      bypassedReason: `Entropy injection bypassed for ${queryType} query to preserve factual precision.`
    };
  }

  const prompt = `Analyze the semantic diversity of the following ${agentOutputs.length} agent outputs for an open-ended/deliberative query.
Evaluate whether they are repeating the exact same viewpoint using synonym substitutions (low diversity/attractor state), or offering genuinely distinct analytical angles, tradeoffs, or counter-arguments.

Rate diversity from 0.0 (identical viewpoints) to 1.0 (completely distinct paradigms).

Agent Outputs:
${agentOutputs.map((o, i) => `[Agent ${i + 1}]: ${o}`).join('\n\n')}

Return strictly JSON:
{
  "diversityScore": 0.0-1.0,
  "reasoning": "Brief rationale for score"
}`;

  try {
    const response = await callGeminiFlash({
      temperature: 0.1,
      systemPrompt: "You are a Semantic Diversity Evaluator measuring analytical variety.",
      userPrompt: prompt,
      maxTokens: 200
    });
    
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("Parse failed");
    const parsed = JSON.parse(jsonMatch[0]);
    
    const score = typeof parsed.diversityScore === "number" ? parsed.diversityScore : 0.5;
    const isCollapse = score < threshold;
    
    return {
      currentDiversityScore: score,
      isInAttractorState: isCollapse,
      requiredEntropyInjection: isCollapse
    };
  } catch (e) {
    return { currentDiversityScore: 0.5, isInAttractorState: false, requiredEntropyInjection: false };
  }
}

// When entropy drops in exploratory domains, we append this to agent prompts for subsequent passes
export const ENTROPY_INJECTION_PROMPT = "\n\n[DELIBERATIVE DIRECTIVE: DIVERGENT THINKING ACTIVATION] Prior outputs have converged closely. Without inventing false facts, deliberately explore an alternative framework, focus on an under-addressed edge case, or stress-test non-obvious operational tradeoffs.";

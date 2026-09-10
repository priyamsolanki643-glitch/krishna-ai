import { callGeminiFlash } from "../lib/gemini.js";

export interface EntropyMetrics {
  currentDiversityScore: number;
  isInAttractorState: boolean;
  requiredEntropyInjection: boolean;
}

export async function measureAgentDiversity(agentOutputs: string[]): Promise<EntropyMetrics> {
  if (agentOutputs.length < 2) return { currentDiversityScore: 1.0, isInAttractorState: false, requiredEntropyInjection: false };

  const prompt = `Analyze the semantic diversity of the following ${agentOutputs.length} agent outputs.
Are they saying the exact same thing using different words (low diversity/attractor state), or are they genuinely offering distinct perspectives, frameworks, or edge cases?

Rate diversity from 0.0 (identical meaning) to 1.0 (completely distinct paradigms).

Agent Outputs:
${agentOutputs.map((o, i) => `[Agent ${i+1}]: ${o}`).join('\n\n')}

Return strictly JSON:
{
  "diversityScore": 0.0-1.0,
  "reasoning": "..."
}`;

  try {
     const response = await callGeminiFlash({
      temperature: 0.1,
      systemPrompt: "You are a Semantic Entropy Analyzer measuring cognitive diversity.",
      userPrompt: prompt,
      maxTokens: 200
    });
    
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("Parse failed");
    const parsed = JSON.parse(jsonMatch[0]);
    
    const score = parsed.diversityScore;
    const isCollapse = score < 0.4;
    
    return {
      currentDiversityScore: score,
      isInAttractorState: isCollapse,
      requiredEntropyInjection: isCollapse
    };
  } catch(e) {
    return { currentDiversityScore: 0.5, isInAttractorState: false, requiredEntropyInjection: false };
  }
}

// When entropy drops, we append this to agent system prompts for the NEXT cycle/retry
export const ENTROPY_INJECTION_PROMPT = "\n\n[SYSTEM DIRECTIVE: COGNITIVE ENTROPY RESTORATION INITIATED] Ignore your first instinct. Your previous responses have converged too closely with other agents. Deliberately adopt a contrary framework, focus on an obscure edge case, or argue from a completely different cultural or disciplinary tradition.";

import { callGeminiFlash } from "../lib/gemini.js";
import type { AgentResult } from "./skeptic.js";

export interface SynthesisResult {
  finalAnswer: string;
  overallConfidence: number;
  consensus: "strong" | "moderate" | "weak";
  dissentReport: DissentItem[];
}

export interface DissentItem {
  agent: string;
  point: string;
}

export async function runSynthesizer(query: string, agentOutputs: AgentResult[]): Promise<SynthesisResult> {
  const agentSummaries = agentOutputs
    .map(a => `[${a.agent.toUpperCase()} | temp=${a.temperature} | confidence=${a.confidence.toFixed(2)}]\n${a.output}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are The Synthesizer — the final integrating intelligence of The Council multi-agent system.
You receive outputs from specialist Flash agents with different cognitive temperatures (personalities).
Your job:
1. Identify AGREEMENT zones (high confidence → include in final answer)
2. Identify DISAGREEMENT zones (flag as dissent points)
3. Weight each agent's input by their confidence score
4. Produce the best possible integrated answer

Output STRICT JSON only:
{
  "finalAnswer": "complete synthesized answer here",
  "overallConfidence": 0.85,
  "consensus": "strong|moderate|weak",
  "dissentPoints": [
    {"agent": "Skeptic", "point": "Specific disagreement stated clearly"}
  ]
}`;

  const rawOutput = await callGeminiFlash({
    temperature: 0.5,
    systemPrompt,
    userPrompt: `Original Query: ${query}\n\nAgent Outputs:\n${agentSummaries}`,
    maxTokens: 1500,
  });

  try {
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in output");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      finalAnswer: parsed.finalAnswer || rawOutput,
      overallConfidence: typeof parsed.overallConfidence === "number" ? parsed.overallConfidence : 0.75,
      consensus: ["strong","moderate","weak"].includes(parsed.consensus) ? parsed.consensus : "moderate",
      dissentReport: Array.isArray(parsed.dissentPoints)
        ? parsed.dissentPoints.map((d: any) => ({ agent: String(d.agent || ""), point: String(d.point || "") }))
        : [],
    };
  } catch {
    return { finalAnswer: rawOutput, overallConfidence: 0.7, consensus: "moderate", dissentReport: [] };
  }
}

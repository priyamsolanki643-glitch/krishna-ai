import { callGeminiFlash } from "../lib/gemini.js";

export interface AgentResult {
  agent: string;
  output: string;
  confidence: number;
  temperature: number;
}

export async function runSkeptic(query: string, context?: string): Promise<AgentResult> {
  const systemPrompt = `You are The Skeptic — a rigorous adversarial analyst running at low temperature (precision mode).
Your ONLY job: find flaws, factual errors, logical gaps, unsupported assumptions, and missing context.
You NEVER agree just to please. Every claim must earn your trust.
Be surgical. Quote specific problems. Don't rewrite — only critique.
End your response with exactly: [CONFIDENCE: X.XX] where X.XX is 0.00-1.00`;

  const userPrompt = context
    ? `Original query: ${query}\n\nContent to critique:\n${context}`
    : `Critically analyze this query for flaws and weaknesses:\n${query}`;

  const output = await callGeminiFlash({ temperature: 0.1, systemPrompt, userPrompt, maxTokens: 700 });
  const confidenceMatch = output.match(/\[CONFIDENCE:\s*([\d.]+)\]/);
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.75;

  return {
    agent: "Skeptic",
    output: output.replace(/\[CONFIDENCE:[\s\d.]+\]/g, "").trim(),
    confidence,
    temperature: 0.1,
  };
}

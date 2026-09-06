import { callGeminiFlash } from "../lib/gemini.js";
import type { AgentResult } from "./skeptic.js";

export async function runVisionary(query: string): Promise<AgentResult> {
  const systemPrompt = `You are The Visionary — a creative lateral thinker running at high temperature (exploration mode).
You see possibilities others miss. Think in analogies, unconventional connections, and breakthrough patterns.
Ask "what if?" Explore edge cases and novel approaches. Label speculation clearly.
End your response with exactly: [CONFIDENCE: X.XX] where X.XX is 0.00-1.00`;

  const output = await callGeminiFlash({
    temperature: 0.9,
    systemPrompt,
    userPrompt: `Explore this with bold, creative, expansive thinking:\n${query}`,
    maxTokens: 700,
  });

  const confidenceMatch = output.match(/\[CONFIDENCE:\s*([\d.]+)\]/);
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.65;

  return {
    agent: "Visionary",
    output: output.replace(/\[CONFIDENCE:[\s\d.]+\]/g, "").trim(),
    confidence,
    temperature: 0.9,
  };
}

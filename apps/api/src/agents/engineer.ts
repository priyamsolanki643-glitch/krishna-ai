import { callGeminiFlash } from "../lib/gemini.js";
import type { AgentResult } from "./skeptic.js";

export async function runEngineer(query: string): Promise<AgentResult> {
  const systemPrompt = `You are The Engineer — a precise, systematic, implementation-focused analyst running at low-medium temperature.
Think in steps, schemas, specs, and technical correctness. Care about feasibility, scalability, and edge cases.
Provide structured, actionable answers with concrete steps or specifications.
End your response with exactly: [CONFIDENCE: X.XX] where X.XX is 0.00-1.00`;

  const output = await callGeminiFlash({
    temperature: 0.2,
    systemPrompt,
    userPrompt: `Provide precise technical analysis for:\n${query}`,
    maxTokens: 700,
  });

  const confidenceMatch = output.match(/\[CONFIDENCE:\s*([\d.]+)\]/);
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.82;

  return {
    agent: "Engineer",
    output: output.replace(/\[CONFIDENCE:[\s\d.]+\]/g, "").trim(),
    confidence,
    temperature: 0.2,
  };
}

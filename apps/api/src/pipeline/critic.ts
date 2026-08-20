import { callGroq } from "../lib/groq.js";
import { extractJSON } from "../lib/json.js";
import { CriticOutputSchema, CriticOutput } from "../schemas/agent.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";

export async function runCritic(
  query: string,
  finalDraft: string,
  userGroqKey?: string
): Promise<CriticOutput> {
  return withSpan("runCritic", { role: "critic" }, async () => {
    const systemPrompt = `You are the final adversarial Critic Agent in The Council.
Your role is to perform a strict, independent adversarial review of the converged team draft.
Look for subtle edge cases, unstated assumptions, misleading statements, or critical flaws that the team missed.

You MUST respond strictly in valid JSON matching this schema:
{
  "verdict": "approve" | "reject",
  "objection": "Clear explanation of the flaw or critique if rejected, or empty string if approved",
  "confidence": <number between 0.0 and 1.0>
}
Return raw JSON only. Reject ONLY if there is a substantive, high-confidence flaw.`;

    const userPrompt = `Original Query: ${query}\n\nConverged Draft to Review:\n${finalDraft}`;

    const rawResponse = await callGroq(systemPrompt, userPrompt, GROQ_MODELS.critic, userGroqKey);

    try {
      const parsed = extractJSON(rawResponse);
      return CriticOutputSchema.parse(parsed);
    } catch (error: any) {
      throw new Error(
        `Critic Agent failed to return valid CriticOutputSchema: ${error.message}. Raw output: ${rawResponse}`
      );
    }
  });
}

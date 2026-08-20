import { callGroq } from "../lib/groq.js";
import { extractJSON } from "../lib/json.js";
import { CritiqueOutputSchema, CritiqueOutput } from "../schemas/agent.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";

export async function runReviewer(
  query: string,
  draft: string,
  toneInstruction?: string,
  modelOverride?: string,
  userGroqKey?: string
): Promise<CritiqueOutput> {
  const activeModel = modelOverride || GROQ_MODELS.reviewer;

  return withSpan("runReviewer", { role: "reviewer", model: activeModel }, async () => {
    const tone = toneInstruction ? `Review style: ${toneInstruction}` : "";

    const systemPrompt = `You are the Reviewer Agent in a multi-agent council.
Your job is to critically analyze the draft against the original user query for factual correctness, hallucinations, logic bugs, or omissions.
${tone}

You MUST return ONLY a valid JSON object strictly matching this schema:
{
  "issue": "Specific flaw or 'None'",
  "evidence": "Concrete reasoning or mathematical/factual proof",
  "confidence": 0.95,
  "suggested_fix": "Clear actionable correction or 'None'",
  "verdict": "approve" | "reject"
}
Return raw JSON only.`;

    const userPrompt = `Original Query: ${query}\n\nCurrent Draft to Review:\n${draft}`;

    const rawResponse = await callGroq(systemPrompt, userPrompt, activeModel, userGroqKey);

    try {
      const parsed = extractJSON(rawResponse);
      return CritiqueOutputSchema.parse(parsed);
    } catch (error: any) {
      throw new Error(
        `Reviewer Agent failed to return valid CritiqueOutputSchema: ${error.message}. Raw output: ${rawResponse}`
      );
    }
  });
}

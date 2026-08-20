import { callGroq } from "../lib/groq.js";
import { extractJSON } from "../lib/json.js";
import { DraftOutputSchema, DraftOutput } from "../schemas/agent.js";

export async function runLead(
  query: string,
  previousCritique?: string,
  toneInstruction?: string
): Promise<DraftOutput> {
  const tone = toneInstruction ? `Adopt this tone/style: ${toneInstruction}` : "";
  const feedbackContext = previousCritique
    ? `\nPrevious reviewer critique to address and fix:\n${previousCritique}`
    : "";

  const systemPrompt = `You are the Lead Agent in a rigorous multi-agent council.
Your job is to answer the user query accurately, deeply, and comprehensively.
${tone}
${feedbackContext}

You MUST return ONLY a valid JSON object strictly matching this schema:
{
  "content": "Your complete, verified draft response string",
  "confidence": 0.95
}
Return raw JSON only.`;

  const rawResponse = await callGroq(systemPrompt, query, "openai/gpt-oss-120b");

  try {
    const parsed = extractJSON(rawResponse);
    return DraftOutputSchema.parse(parsed);
  } catch (error: any) {
    throw new Error(
      `Lead Agent failed to return valid DraftOutputSchema: ${error.message}. Raw output: ${rawResponse}`
    );
  }
}

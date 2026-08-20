import { callGroq } from "../lib/groq.js";
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
Your job is to answer the user query accurately and comprehensively.
${tone}
${feedbackContext}

You MUST return ONLY a valid JSON object strictly matching this schema:
{
  "content": "Your complete, verified draft response string",
  "confidence": 0.95 (number between 0.0 and 1.0 reflecting your certainty)
}
Do not wrap your output in markdown backticks or commentary. Return raw JSON only.`;

  const rawResponse = await callGroq(systemPrompt, query, "llama-3.3-70b-versatile");

  try {
    const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return DraftOutputSchema.parse(parsed);
  } catch (error: any) {
    throw new Error(
      `Lead Agent failed to return valid DraftOutputSchema: ${error.message}. Raw output: ${rawResponse}`
    );
  }
}

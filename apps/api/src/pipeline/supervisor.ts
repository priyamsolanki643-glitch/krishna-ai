import { callGroq } from "../lib/groq.js";
import { SupervisorOutputSchema, SupervisorOutput } from "../schemas/agent.js";

export async function runSupervisor(query: string): Promise<SupervisorOutput> {
  const systemPrompt = `You are the Supervisor of The Council.
Your role is to analyze the user's query and classify:
1. Domain: MUST be exactly one of: ["coding", "math", "research", "general"]
2. Emotion: MUST be exactly one of: ["neutral", "frustrated", "excited", "confused"]
3. Tone Instruction: A concise instruction directing downstream agents how to tailor their explanation to the user's emotional state and domain.

You MUST return ONLY a valid JSON object matching this schema:
{
  "domain": "coding" | "math" | "research" | "general",
  "emotion": "neutral" | "frustrated" | "excited" | "confused",
  "tone_instruction": "concise guidance string"
}
Return raw JSON only.`;

  const rawResponse = await callGroq(systemPrompt, query, "llama-3.1-8b-instant");

  try {
    const cleaned = rawResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return SupervisorOutputSchema.parse(parsed);
  } catch (error: any) {
    throw new Error(
      `Supervisor failed to return valid SupervisorOutputSchema: ${error.message}. Raw output: ${rawResponse}`
    );
  }
}

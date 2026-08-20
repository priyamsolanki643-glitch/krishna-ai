import { callGroq } from "../lib/groq.js";
import { extractJSON } from "../lib/json.js";
import { SupervisorOutputSchema, SupervisorOutput } from "../schemas/agent.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";

export async function runSupervisor(query: string, userGroqKey?: string): Promise<SupervisorOutput> {
  return withSpan("runSupervisor", { role: "supervisor" }, async () => {
    const systemPrompt = `You are the Supervisor of The Council.
Your role is to analyze the user's query and classify:
1. Primary Domain: MUST be exactly one of: ["coding", "math", "research", "general"]
2. Domain Scores: If the query spans multiple domains (e.g. coding + math), provide scores (0.0 - 1.0) for each relevant domain.
3. Emotion: MUST be exactly one of: ["neutral", "frustrated", "excited", "confused"]
4. Tone Instruction: A concise instruction directing downstream agents how to tailor their explanation to the user's emotional state and domain.

You MUST return ONLY a valid JSON object matching this schema:
{
  "domain": "coding" | "math" | "research" | "general",
  "domains": [
    { "domain": "coding" | "math" | "research" | "general", "score": <0.0 to 1.0> }
  ],
  "emotion": "neutral" | "frustrated" | "excited" | "confused",
  "tone_instruction": "concise guidance string"
}
Return raw JSON only.`;

    const rawResponse = await callGroq(systemPrompt, query, GROQ_MODELS.supervisor, userGroqKey);

    try {
      const parsed = extractJSON(rawResponse);
      return SupervisorOutputSchema.parse(parsed);
    } catch (error: any) {
      throw new Error(
        `Supervisor Agent failed to return valid SupervisorOutputSchema: ${error.message}. Raw output: ${rawResponse}`
      );
    }
  });
}

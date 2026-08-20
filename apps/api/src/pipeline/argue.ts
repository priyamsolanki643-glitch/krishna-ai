import { callGroq } from "../lib/groq.js";
import { extractJSON } from "../lib/json.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";
import { z } from "zod";

export const ArgumentRulingSchema = z.object({
  verdict: z.enum(["argument_accepted", "argument_rejected"]),
  explanation: z.string(),
  updatedAnswer: z.string().optional(),
});

export type ArgumentRuling = z.infer<typeof ArgumentRulingSchema>;

export async function runArgumentRuling(
  originalQuery: string,
  originalPosition: string,
  targetAgent: "lead" | "reviewer" | "critic",
  userArgument: string,
  userGroqKey?: string
): Promise<ArgumentRuling> {
  return withSpan("runArgumentRuling", { targetAgent }, async () => {
    const systemPrompt = `You are the Supervisor of The Council acting as an impartial judge.
A user is challenging a stated position/output made by the "${targetAgent}" agent in a previous deliberation.

Evaluate the user's counter-argument objectively against the original query and the agent's stance:
1. If the user's argument points out a genuine error, valid counter-example, or superior solution:
   - "verdict": "argument_accepted"
   - "explanation": Concrete reason why the user is correct.
   - "updatedAnswer": A complete, revised, and corrected final answer incorporating the user's valid point.
2. If the user's argument is flawed, based on a misunderstanding, or the original agent's stance holds:
   - "verdict": "argument_rejected"
   - "explanation": Clear, polite, and technically rigorous justification of why the original stance stands.

You MUST respond strictly in valid JSON matching this schema:
{
  "verdict": "argument_accepted" | "argument_rejected",
  "explanation": "Detailed rationale",
  "updatedAnswer": "Revised complete answer (only if accepted)"
}
Return raw JSON only.`;

    const userPrompt = `Original Query: ${originalQuery}\n\nOriginal ${targetAgent} Position/Answer:\n${originalPosition}\n\nUser Counter-Argument:\n${userArgument}`;

    const rawResponse = await callGroq(systemPrompt, userPrompt, GROQ_MODELS.supervisor, userGroqKey);

    try {
      const parsed = extractJSON(rawResponse);
      return ArgumentRulingSchema.parse(parsed);
    } catch (error: any) {
      throw new Error(
        `Supervisor failed to render Argument Ruling: ${error.message}. Raw output: ${rawResponse}`
      );
    }
  });
}

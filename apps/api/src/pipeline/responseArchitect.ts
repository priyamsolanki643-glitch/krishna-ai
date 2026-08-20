import { callGroq } from "../lib/groq.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";

export async function runResponseArchitect(
  finalDraft: string,
  toneInstruction?: string,
  userGroqKey?: string
): Promise<string> {
  return withSpan("runResponseArchitect", { role: "responseArchitect" }, async () => {
    const tone = toneInstruction ? `Style & Tone Requirements: ${toneInstruction}` : "Deliver a clean, structured, and helpful response.";

    const systemPrompt = `You are the Response Architect in The Council.
Your role is to perform the final editorial polish and structural rewrite of the synthesized draft.
Ensure perfect clarity, structure, bulleting, and formatting.
Adapt the phrasing precisely to the user's emotional state and tone instructions.
${tone}

Do NOT output JSON. Return the final, polished response directly in Markdown.`;

    const userPrompt = `Tone Context: ${toneInstruction || "neutral"}\nDraft to Refine:\n${finalDraft}`;

    const formattedResponse = await callGroq(
      systemPrompt,
      userPrompt,
      GROQ_MODELS.responseArchitect,
      userGroqKey
    );

    return formattedResponse;
  });
}

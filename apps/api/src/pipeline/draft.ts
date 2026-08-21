import { callGroq } from "../lib/groq.js";
import { extractJSON } from "../lib/json.js";
import { DraftOutputSchema, DraftOutput } from "../schemas/agent.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";

export async function runLead(
  query: string,
  previousCritique?: string,
  toneInstruction?: string,
  helperContext?: string,
  modelOverride?: string,
  userGroqKey?: string
): Promise<DraftOutput> {
  const activeModel = modelOverride || GROQ_MODELS.lead;

  return withSpan("runLead", { role: "lead", model: activeModel }, async () => {
    const tone = toneInstruction ? `Adopt this tone/style: ${toneInstruction}` : "";
    const feedbackContext = previousCritique
      ? `\nPrevious reviewer critique to address and fix:\n${previousCritique}`
      : "";
    const helperData = helperContext
      ? `\nHelper Agent Research Data provided to assist you:\n${helperContext}`
      : "";

    const systemPrompt = `You are the Lead Agent in a rigorous multi-agent council.
Your job is to answer the user query accurately, deeply, and comprehensively.
${tone}
${feedbackContext}
${helperData}

You MUST return ONLY a valid JSON object strictly matching this schema:
{
  "content": "Your complete, verified draft response string",
  "confidence": 0.95,
  "needs_help": false,
  "help_query": "Optional specific question for the helper if stuck"
}
Return raw JSON only. Set "needs_help" to true ONLY if you are genuinely stuck and need an ephemeral Helper Agent to research a specific sub-problem.`;

    const rawResponse = await callGroq(systemPrompt, query, activeModel, userGroqKey);

    try {
      const parsed = extractJSON(rawResponse);
      return DraftOutputSchema.parse(parsed);
    } catch (error: any) {
      // If model outputs direct string or markdown without JSON wrapper, wrap safely
      const cleanContent = rawResponse.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      return {
        content: cleanContent || "Draft response generated.",
        confidence: 0.95,
        needs_help: false,
        is_mock: false
      };
    }
  });
}

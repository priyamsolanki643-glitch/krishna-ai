import { callGroq } from "../lib/groq.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";
import type { DebateResult } from "./loop.js";

export async function mergeTeamOutputs(
  query: string,
  results: { domain: string; result: DebateResult }[],
  userGroqKey?: string
): Promise<string> {
  return withSpan("mergeTeamOutputs", { role: "compiler" }, async () => {
    const systemPrompt = `You are the Compiler Agent in The Council.
Multiple specialized domain teams ran in parallel to address distinct facets of the user's multi-domain query.
Your job is to synthesize all specialized team outputs into a single, cohesive, unified master draft.
Merge the insights, code, mathematical derivations, and explanations smoothly into ONE seamless answer.
Eliminate redundancies, ensure consistency in notation and style.
CRITICAL RULE: NEVER include internal team labels or headers like "Specialized Team 1", "Team 2", or domain headings like "(CODING TEAM)". The final reader should see a single harmonious answer.

Do NOT output JSON. Output the comprehensive merged response directly in Markdown.`;

    const formattedDrafts = results
      .map((r, i) => `### Specialized Team ${i + 1} (${r.domain.toUpperCase()} Team):\n${r.result.finalDraft}`)
      .join("\n\n------------------------------------\n\n");

    const userPrompt = `User Query: ${query}\n\nSpecialized Team Drafts:\n${formattedDrafts}`;

    const mergedOutput = await callGroq(
      systemPrompt,
      userPrompt,
      GROQ_MODELS.compiler,
      userGroqKey
    );

    return mergedOutput;
  });
}

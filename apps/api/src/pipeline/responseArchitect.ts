import { callGroq } from "../lib/groq.js";
import { extractJSON } from "../lib/json.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";

export interface ResponseArchitectInput {
  finalDraft: string;
  query: string;
  toneInstruction?: string;
  hasLiveSources?: boolean;
  criticFlagged?: boolean;
  rounds?: number;
  criticObjection?: string;
  critiqueSummary?: string;
  confidenceScore?: number;
  userGroqKey?: string;
}

export interface ResponseArchitectOutput {
  formattedContent: string;
  disagreement: {
    occurred: boolean;
    summary: string | null;
  };
  hasLiveSource: boolean;
}

function extractContentRobust(raw: string): string {
  try {
    const p = JSON.parse(raw);
    if (p.content) return p.content;
    if (p.answer) return p.answer;
  } catch(e) {}

  let m = raw.match(/"content"\s*:\s*"([\s\S]*?)",\s*"disagreement"\s*:/);
  if (m) return m[1].replace(/\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\\\/g, "\\");

  m = raw.match(/"disagreement"\s*:[\s\S]*?,\s*"content"\s*:\s*"([\s\S]*?)"\s*}/);
  if (m) return m[1].replace(/\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\\\/g, "\\");

  let stripped = raw.replace(/^[\s\S]*?"content"\s*:\s*"?/, "");
  stripped = stripped.replace(/"?\s*,\s*"disagreement"\s*:[\s\S]*$/, "");
  stripped = stripped.replace(/"?\s*}\s*$/, "");
  
  return stripped.replace(/\\n/g, "\n").replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
}

export async function runResponseArchitect(
  input: ResponseArchitectInput
): Promise<ResponseArchitectOutput> {
  return withSpan("runResponseArchitect", { role: "responseArchitect" }, async () => {
    const isContested = Boolean(input.criticFlagged || (input.rounds && input.rounds >= 2));
    const confidence = input.confidenceScore !== undefined ? input.confidenceScore : (isContested ? 0.8 : 0.98);
    const hasLiveSource = Boolean(input.hasLiveSources);

    const disputeDetails = isContested
      ? `INTERNAL COUNCIL DISPUTE CONTEXT (Contested Answer):
- Critic Flagged / Objection: ${input.criticObjection || "Critic requested revision on edge cases/logic"}
- Reviewer Critique: ${input.critiqueSummary || "Draft underwent iterative revision"}
- Rounds: ${input.rounds || 2}
- Confidence: ${confidence}`
      : `INTERNAL COUNCIL CONTEXT: Clean unanimous approval in round 1. No disputes.`;

    const systemPrompt = `You are the Response Architect in The Council.
You govern how every final answer is written and formatted according to these strict rules:

1. LEAD WITH THE ANSWER:
The very first sentence MUST contain real substantive information.
ABSOLUTELY NO "Great question!", no repeating or restating the prompt back, no throat-clearing before substance.

2. HONEST CONFIDENCE CALIBRATION:
Never be uniformly upbeat. If the Council confidence is moderate/low or the debate was contested, use appropriate hedging language ("This is likely...", "The Council noted ambiguity regarding...", "Current evidence suggests..."). Do not state uncertain conclusions with flat certainty.

3. CLAIM-SPECIFIC CITATIONS:
When research citations exist, weave attribution directly into the exact sentence making that claim. Do NOT just dump a disconnected link list at the bottom.

4. MATCH DEPTH TO THE QUESTION:
A straightforward factual question deserves a direct answer with concise support. Do not force artificial headers or unnecessary bullet lists if not needed. Only genuinely complex questions warrant deep multi-section structure.

5. NEVER STATE INFERENCE AS FACT & SOURCE ATTRIBUTION:
- When HAS LIVE SOURCES is true: Weave the source attribution (name/URL) directly into the sentence asserting the claim.
- When HAS LIVE SOURCES is false: Explicitly state "Based on general knowledge, not a live source," or include that disclaimer when presenting the facts rather than claiming real-time verified certainty.

6. SURFACE REAL INTERNAL DISAGREEMENT (THE CENTERPIECE RULE):
- If genuine disagreement or pushback occurred (isContested = true), summarize it honestly in the "disagreement" field in 1-2 sentences: what was contested and why the final position was adopted.
- If no disagreement occurred (isContested = false), set "disagreement.occurred" to false and "disagreement.summary" to null. Never fabricate drama when consensus was clean.

YOU MUST RETURN A VALID JSON OBJECT WITH EXACTLY THIS SCHEMA:
{
  "content": "The complete, polished final answer in Markdown directly answering the user query",
  "disagreement": {
    "occurred": boolean,
    "summary": "1-2 sentence honest summary of the internal debate/objection, or null if clean"
  }
}`;

    const userPrompt = `USER QUERY: ${input.query}
${disputeDetails}
HAS LIVE SOURCES: ${hasLiveSource}
TONE REQUIREMENT: ${input.toneInstruction || "neutral"}

RAW SYNTHESIZED DRAFT TO REFINE:
${input.finalDraft}`;

    const rawResponse = await callGroq(
      systemPrompt,
      userPrompt,
      GROQ_MODELS.responseArchitect,
      input.userGroqKey
    );

    try {
      const parsed = extractJSON(rawResponse);
      
      let content = "";
      if (parsed && typeof parsed.content === "string") {
        content = parsed.content;
      } else if (parsed && typeof parsed.answer === "string") {
        content = parsed.answer;
      } else if (parsed && typeof parsed.response === "string") {
        content = parsed.response;
      } else if (typeof parsed === "string") {
        content = parsed;
      } else {
        content = extractContentRobust(rawResponse);
      }

      content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      const occurred = Boolean(parsed?.disagreement?.occurred ?? isContested);
      let summary = parsed?.disagreement?.summary ?? null;

      if (!occurred) {
        summary = null;
      } else if (occurred && !summary) {
        summary = input.criticObjection || input.critiqueSummary || "Council debated edge case assumptions before reaching final consensus.";
      }

      return {
        formattedContent: content || input.finalDraft,
        disagreement: {
          occurred,
          summary,
        },
        hasLiveSource,
      };
    } catch (err) {
      console.warn("Response Architect JSON parse error. Extracting fallback content:", err);
      let cleanContent = extractContentRobust(rawResponse);
      cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      
      return {
        formattedContent: cleanContent || input.finalDraft,
        disagreement: {
          occurred: isContested,
          summary: isContested ? (input.criticObjection || "The Council debated edge cases before finalizing this position.") : null,
        },
        hasLiveSource,
      };
    }
  });
}

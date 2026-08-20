import { callGroq } from "../lib/groq.js";
import { withSpan } from "../lib/telemetry.js";

export async function runHelper(
  problemDescription: string,
  domain: string
): Promise<{ result: string; is_mock: boolean }> {
  return withSpan("runHelper", { role: "helper" }, async () => {
    const systemPrompt = `You are a specialized Helper Agent in The Council.
Your role is to solve specific, narrow problems blocking the Lead Agent.
Domain context: ${domain}
Provide a direct, factual, and concise solution to the problem provided.
Do NOT format as JSON. Provide plain text/markdown.`;

    const rawResponse = await callGroq(systemPrompt, `Problem: ${problemDescription}`, "llama-3.1-8b-instant");

  // In mock mode, callGroq will return JSON due to other matchers or a generic string.
  // We'll parse is_mock manually for now if it happens to be JSON, but normally it's plain text.
  let is_mock = false;
  try {
    const parsed = JSON.parse(rawResponse);
    if (parsed.is_mock) is_mock = true;
  } catch {
    // Normal plain text response from LLM
  }

    return { result: rawResponse, is_mock };
  });
}

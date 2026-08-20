import { isMockMode } from "./groq.js";

export function extractJSON(rawText: string): any {
  let text = rawText.trim();
  
  // Remove markdown codeblock wrapper if present
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  
  // Find outermost JSON object bounds if there is surrounding commentary
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(text);
  if (typeof parsed === "object" && parsed !== null) {
    if (parsed.is_mock === undefined) {
      parsed.is_mock = isMockMode();
    }
  }
  return parsed;
}

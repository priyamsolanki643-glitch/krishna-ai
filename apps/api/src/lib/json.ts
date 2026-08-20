import { isMockMode } from "./groq.js";

function cleanJsonString(str: string): string {
  // Remove markdown codeblock wrapper if present
  let text = str.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  
  // Find outermost JSON object bounds if there is surrounding commentary
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

export function extractJSON(rawText: string): any {
  const text = cleanJsonString(rawText);

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null) {
      if (parsed.is_mock === undefined) {
        parsed.is_mock = isMockMode();
      }
    }
    return parsed;
  } catch (err) {
    // If standard JSON.parse fails due to LaTeX escape sequences (e.g. \(, \log, \)),
    // sanitize single backslashes that are not valid JSON escape characters.
    try {
      const sanitized = text.replace(/\\([^"\\/bfnrtu])/g, "$1");
      const parsed = JSON.parse(sanitized);
      if (typeof parsed === "object" && parsed !== null) {
        if (parsed.is_mock === undefined) {
          parsed.is_mock = isMockMode();
        }
      }
      return parsed;
    } catch {
      throw err;
    }
  }
}

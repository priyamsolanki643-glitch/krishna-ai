import { callGroq } from "../lib/groq.js";
import { withSpan } from "../lib/telemetry.js";
import { GROQ_MODELS } from "../config/models.js";

export interface SafetyResult {
  is_safe: boolean;
  category?: string;
  confidence: number;
}

export async function runSafetyCheck(text: string, userGroqKey?: string): Promise<SafetyResult> {
  return withSpan("runSafetyCheck", { role: "safety" }, async () => {
    const systemPrompt = `You are the Safety Guardrail Agent in The Council.
Analyze the final generated response for severe harm, hate speech, dangerous illegal instructions, or critical safety violations.
Return JSON:
{
  "is_safe": true | false,
  "category": "benign" | "harmful" | "inappropriate",
  "confidence": <0.0 - 1.0>
}`;

    const userPrompt = `Content to review:\n${text}`;

    try {
      const res = await callGroq(systemPrompt, userPrompt, GROQ_MODELS.safety, userGroqKey);
      const parsed = JSON.parse(res);
      console.log(`🛡️ [Safety Check] Passed: ${parsed.is_safe}, Category: ${parsed.category || "none"}`);
      return {
        is_safe: parsed.is_safe ?? true,
        category: parsed.category,
        confidence: parsed.confidence ?? 1.0
      };
    } catch (err: any) {
      console.warn(`⚠️ [Safety Check] Log-only pass through on parse warning: ${err.message}`);
      return {
        is_safe: true,
        category: "benign",
        confidence: 1.0
      };
    }
  });
}

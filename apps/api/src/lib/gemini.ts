import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Using gemini-2.0-flash for improved performance, speed, and reasoning
export const FLASH_MODEL = "gemini-2.0-flash";

export interface GeminiCallOptions {
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export async function callGeminiFlash(opts: GeminiCallOptions): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: FLASH_MODEL,
    systemInstruction: opts.systemPrompt,
    generationConfig: {
      temperature: opts.temperature,
      maxOutputTokens: opts.maxTokens ?? 1024,
    },
  });
  const result = await model.generateContent(opts.userPrompt);
  const text = result.response.text();
  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned empty response");
  }
  return text;
}

export function isGeminiConfigured(): boolean {
  return !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
export const FLASH_MODEL = "gemini-1.5-flash";

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
      maxOutputTokens: opts.maxTokens || 1024,
    },
  });
  const result = await model.generateContent(opts.userPrompt);
  return result.response.text();
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

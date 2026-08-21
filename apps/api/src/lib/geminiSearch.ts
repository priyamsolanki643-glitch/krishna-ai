import { GoogleGenerativeAI } from "@google/generative-ai";
import { TavilySearchResult } from "./tavily.js";

export type GeminiSearchResponse =
  | { results: TavilySearchResult[]; success: true }
  | { success: false; error: string };

/**
 * Fallback live web search using Google Gemini API with Google Search grounding.
 * Output is normalized to the exact same { title, url, content }[] shape as Tavily.
 */
export async function searchGemini(
  query: string,
  apiKeyOverride?: string
): Promise<GeminiSearchResponse> {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY is not configured.",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure Gemini with Google Search tool grounding
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // @ts-ignore - Google search tool definition
      tools: [{ googleSearch: {} }],
    });

    const prompt = `Perform a live web search to find current information and citations for: "${query}". Summarize key facts and findings clearly.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;

    const textContent = response.text() || "";
    const candidate = response.candidates?.[0];
    const groundingMetadata = (candidate as any)?.groundingMetadata;

    const normalizedResults: TavilySearchResult[] = [];

    // Extract grounding chunks and web sources if provided by Gemini
    if (groundingMetadata?.groundingChunks && Array.isArray(groundingMetadata.groundingChunks)) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web) {
          normalizedResults.push({
            title: chunk.web.title || "Google Search Result",
            url: chunk.web.uri || "",
            content: textContent.slice(0, 350),
          });
        }
      }
    }

    // Fallback: If no discrete metadata chunks, return text content with domain source
    if (normalizedResults.length === 0) {
      normalizedResults.push({
        title: "Google Search Grounded Synthesis",
        url: "https://www.google.com/search?q=" + encodeURIComponent(query),
        content: textContent,
      });
    }

    return {
      results: normalizedResults,
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Gemini search error: ${err.message}`,
    };
  }
}

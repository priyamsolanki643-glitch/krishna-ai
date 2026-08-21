import { searchTavily, TavilySearchResult } from "./tavily.js";
import { searchGemini } from "./geminiSearch.js";

export interface ResearchResult {
  results: TavilySearchResult[];
  provider: "tavily" | "gemini";
  success: boolean;
  error?: string;
}

/**
 * Combines Tavily (primary) and Gemini Grounding (fallback) into a single resilient search pipeline.
 * If Tavily encounters quota/credit exhaustion or network errors, seamlessly falls back to Gemini.
 */
export async function performResearch(
  query: string,
  options?: { forceQuotaError?: boolean; tavilyKey?: string; geminiKey?: string }
): Promise<ResearchResult> {
  // Test flag to simulate Tavily quota exhaustion during test suites
  if (options?.forceQuotaError) {
    console.log("🧪 [performResearch] Forced quota error simulation. Falling back to Gemini.");
    const geminiRes = await searchGemini(query, options?.geminiKey);
    if (geminiRes.success) {
      return {
        results: geminiRes.results,
        provider: "gemini",
        success: true,
      };
    }
    return {
      results: [],
      provider: "gemini",
      success: false,
      error: geminiRes.error,
    };
  }

  // 1. Primary: Call Tavily Search
  const tavilyRes = await searchTavily(query, options?.tavilyKey);

  if (tavilyRes.success && tavilyRes.results.length > 0) {
    return {
      results: tavilyRes.results,
      provider: "tavily",
      success: true,
    };
  }

  console.warn(`⚠️ [performResearch] Tavily search unavailable (${!tavilyRes.success ? (tavilyRes as any).error : "empty results"}). Falling back to Gemini Grounding...`);

  // 2. Fallback: Call Google Gemini Grounded Search
  const geminiRes = await searchGemini(query, options?.geminiKey);

  if (geminiRes.success && geminiRes.results.length > 0) {
    return {
      results: geminiRes.results,
      provider: "gemini",
      success: true,
    };
  }

  console.error(`❌ [performResearch] Both Tavily and Gemini search failed. Proceeding with degraded search context.`);

  return {
    results: [],
    provider: "gemini",
    success: false,
    error: `Both search providers failed. Tavily: ${!tavilyRes.success ? (tavilyRes as any).error : "empty"}, Gemini: ${geminiRes.success ? "empty" : geminiRes.error}`,
  };
}

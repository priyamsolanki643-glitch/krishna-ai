export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
}

export type TavilySearchResponse =
  | { results: TavilySearchResult[]; success: true }
  | { success: false; error: string; isQuotaError: boolean };

/**
 * Executes a live web search using Tavily's standard Basic depth API.
 * Never uses advanced or research depth to preserve quota/cost.
 */
export async function searchTavily(
  query: string,
  apiKeyOverride?: string
): Promise<TavilySearchResponse> {
  const apiKey = apiKeyOverride || process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "TAVILY_API_KEY is not configured.",
      isQuotaError: false,
    };
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let isQuota = false;

      // Status code 429 = Rate Limit / Quota Exceeded; 432 = Plan Limit Reached
      if (
        res.status === 429 ||
        res.status === 432 ||
        errText.toLowerCase().includes("quota") ||
        errText.toLowerCase().includes("credit") ||
        errText.toLowerCase().includes("rate limit") ||
        errText.toLowerCase().includes("limit exceeded")
      ) {
        isQuota = true;
      }

      return {
        success: false,
        error: `Tavily API error (${res.status}): ${errText}`,
        isQuotaError: isQuota,
      };
    }

    const data: any = await res.json();
    const rawResults = data.results || [];

    const normalizedResults: TavilySearchResult[] = rawResults.map((r: any) => ({
      title: r.title || "Web Resource",
      url: r.url || "",
      content: r.content || "",
    }));

    return {
      results: normalizedResults,
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Tavily network/execution error: ${err.message}`,
      isQuotaError: false,
    };
  }
}

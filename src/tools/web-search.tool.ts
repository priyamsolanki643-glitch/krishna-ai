import { z } from 'zod';
import { toolRegistry } from './registry.js';
import { createLogger } from '../utils/logger.js';
import { env } from '../config/env.js';

const log = createLogger('web-search-tool');

// ============================================================
// Web Search Tool — Tavily / Brave / SerpAPI
// ============================================================

const WebSearchParams = z.object({
  query: z.string().min(1).max(500).describe('The search query'),
  maxResults: z.number().min(1).max(10).default(5).describe('Maximum number of results'),
  searchDepth: z.enum(['basic', 'advanced']).default('basic').describe('Search depth'),
});

/**
 * Search the web using Tavily API (primary), Brave Search (fallback), or SerpAPI (fallback)
 */
async function executeWebSearch(args: Record<string, unknown>): Promise<{
  output: string;
  status: 'success' | 'error' | 'timeout';
  executionTimeMs: number;
  metadata?: Record<string, unknown>;
}> {
  const { query, maxResults, searchDepth } = args as z.infer<typeof WebSearchParams>;

  // ── Try Tavily ──
  if (env.TAVILY_API_KEY) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: env.TAVILY_API_KEY,
          query,
          max_results: maxResults,
          search_depth: searchDepth,
          include_answer: true,
          include_raw_content: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as {
        answer?: string;
        results: Array<{ title: string; url: string; content: string; score: number }>;
      };

      const formatted = data.results
        .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content}`)
        .join('\n\n');

      const output = data.answer
        ? `**AI Summary:** ${data.answer}\n\n---\n\n**Sources:**\n${formatted}`
        : `**Search Results for "${query}":**\n\n${formatted}`;

      return {
        output,
        status: 'success',
        executionTimeMs: 0,
        metadata: { provider: 'tavily', resultsCount: data.results.length },
      };
    } catch (error) {
      log.warn({ error: (error as Error).message }, 'Tavily search failed, trying fallback');
    }
  }

  // ── Try Brave Search ──
  if (env.BRAVE_SEARCH_API_KEY) {
    try {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', String(maxResults));

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': env.BRAVE_SEARCH_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Brave Search error: ${response.status}`);
      }

      const data = (await response.json()) as {
        web?: { results: Array<{ title: string; url: string; description: string }> };
      };

      const results = data.web?.results || [];
      const formatted = results
        .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.description}`)
        .join('\n\n');

      return {
        output: `**Search Results for "${query}":**\n\n${formatted}`,
        status: 'success',
        executionTimeMs: 0,
        metadata: { provider: 'brave', resultsCount: results.length },
      };
    } catch (error) {
      log.warn({ error: (error as Error).message }, 'Brave search failed');
    }
  }

  // ── No search provider configured ──
  return {
    output: `Web search is not available. Configure TAVILY_API_KEY or BRAVE_SEARCH_API_KEY in your .env file.\n\nQuery was: "${query}"`,
    status: 'error',
    executionTimeMs: 0,
    metadata: { provider: 'none' },
  };
}

/**
 * Register the web search tool
 */
export function registerWebSearchTool(): void {
  toolRegistry.register({
    name: 'web_search',
    description: 'Search the web for real-time information, news, documentation, and answers. Returns summarized results from multiple sources.',
    category: 'search',
    parameters: WebSearchParams,
    execute: executeWebSearch,
    enabled: !!(env.TAVILY_API_KEY || env.BRAVE_SEARCH_API_KEY || env.SERP_API_KEY),
  });

  log.info('Web search tool registered');
}

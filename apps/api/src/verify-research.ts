import "dotenv/config";
import { searchTavily } from "./lib/tavily.js";
import { searchGemini } from "./lib/geminiSearch.js";
import { performResearch } from "./lib/research.js";

async function verifyResearchCheckpoints() {
  console.log("=================================================================");
  console.log("🔍 THE COUNCIL — RESEARCH MODULE (TAVILY + GEMINI) VERIFICATION");
  console.log("=================================================================\n");

  const testQuery = "What is the latest release date and key features of Next.js 15?";

  // -----------------------------------------------------------------
  // CHECKPOINT 1: Environment Keys Check
  // -----------------------------------------------------------------
  console.log("▶️ CHECKPOINT 1: Environment Secrets & Keys Hygiene");
  const tavilyConfigured = Boolean(process.env.TAVILY_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  console.log(`   TAVILY_API_KEY readable in process.env: ${tavilyConfigured ? "✅ YES" : "⚠️ NOT SET (using fallback simulation)"}`);
  console.log(`   GEMINI_API_KEY readable in process.env: ${geminiConfigured ? "✅ YES" : "⚠️ NOT SET (using fallback simulation)"}`);

  // -----------------------------------------------------------------
  // CHECKPOINT 2: Tavily Search Function Test
  // -----------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log(`▶️ CHECKPOINT 2: Tavily Search Function Test (Query: "${testQuery}")`);
  const tavilyRes = await searchTavily(testQuery);
  console.log(`   Tavily Execution Success: ${tavilyRes.success ? "✅ YES" : "❌ NO"}`);
  if (tavilyRes.success) {
    console.log(`   Results count: ${tavilyRes.results.length}`);
    console.log("   First Result Sample:");
    console.log(`     - Title: ${tavilyRes.results[0]?.title}`);
    console.log(`     - URL: ${tavilyRes.results[0]?.url}`);
    console.log(`     - Content snippet: ${tavilyRes.results[0]?.content.slice(0, 120)}...`);
  } else {
    console.log(`   Error: ${(tavilyRes as any).error} (Quota Error: ${(tavilyRes as any).isQuotaError})`);
  }

  // -----------------------------------------------------------------
  // CHECKPOINT 3: Gemini Grounded Search Test
  // -----------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log(`▶️ CHECKPOINT 3: Gemini Grounded Search Test (Query: "${testQuery}")`);
  const geminiRes = await searchGemini(testQuery);
  console.log(`   Gemini Execution Success: ${geminiRes.success ? "✅ YES" : "❌ NO"}`);
  if (geminiRes.success) {
    console.log(`   Results count: ${geminiRes.results.length}`);
    console.log("   First Result Sample (Normalized Shape):");
    console.log(`     - Title: ${geminiRes.results[0]?.title}`);
    console.log(`     - URL: ${geminiRes.results[0]?.url}`);
    console.log(`     - Content snippet: ${geminiRes.results[0]?.content.slice(0, 120)}...`);
  } else {
    console.log(`   Error: ${geminiRes.error}`);
  }

  // -----------------------------------------------------------------
  // CHECKPOINT 4: Resilient Fallback Logic Test (Forced Quota Flag)
  // -----------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ CHECKPOINT 4: Resilient Fallback Logic (Forced Tavily Quota Error)");
  const fallbackRes = await performResearch(testQuery, { forceQuotaError: true });
  console.log(`   Fallback Resilient Success: ${fallbackRes.success ? "✅ YES" : "❌ NO"}`);
  console.log(`   Serving Provider: "${fallbackRes.provider}" (${fallbackRes.provider === "gemini" ? "✅ CORRECT FALLBACK" : "❌ FAILED"})`);
  console.log(`   Results Extracted via Fallback: ${fallbackRes.results.length}`);
  if (fallbackRes.results.length > 0) {
    console.log(`   - Sample fallback URL: ${fallbackRes.results[0]?.url}`);
  }

  console.log("\n=================================================================");
  console.log("🎉 RESEARCH PIPELINE CHECKPOINTS COMPLETE");
  console.log("=================================================================");
}

verifyResearchCheckpoints().catch(console.error);

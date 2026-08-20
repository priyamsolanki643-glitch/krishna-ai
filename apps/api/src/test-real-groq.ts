import { runDebateLoop } from "./pipeline/loop.js";

async function runRealGroqTest() {
  console.log("=================================================================");
  console.log("🚀 RUNNING REAL GROQ TEST (NON-MOCK)");
  console.log("=================================================================");
  
  const res = await runDebateLoop("Explain why a binary search tree is faster than a linked list.", undefined, async (e) => {
    console.log(`   [SSE thinking] Round ${e.round} - ${e.stage}:`, JSON.stringify(e.data || {}));
  });
  
  console.log("\n✅ Result from Real Groq API:");
  console.log(JSON.stringify(res, null, 2));

  const { shutdownTelemetry } = await import("./lib/telemetry.js");
  await shutdownTelemetry();
}

runRealGroqTest().catch(console.error);

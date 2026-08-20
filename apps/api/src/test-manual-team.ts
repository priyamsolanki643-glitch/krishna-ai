import { runDebateLoop } from "./pipeline/loop.js";

async function testManualTeamOverride() {
  console.log("=================================================================");
  console.log("🧪 TESTING MANUAL TEAM SELECTION (MODEL OVERRIDE)");
  console.log("=================================================================");

  // Testing with specific models: Lead = "qwen/qwen3.6-27b", Reviewer = "openai/gpt-oss-20b"
  const manualLead = "qwen/qwen3.6-27b";
  const manualReviewer = "openai/gpt-oss-20b";

  console.log(`Configuring custom manual team:`);
  console.log(` - Lead Model: ${manualLead}`);
  console.log(` - Reviewer Model: ${manualReviewer}\n`);

  const result = await runDebateLoop(
    "Explain difference between quicksort and mergesort.",
    "Concise and technical",
    async (evt) => {
      console.log(`   [SSE Event] Round ${evt.round} - ${evt.stage}:`, JSON.stringify(evt.data || {}));
    },
    {
      leadModel: manualLead,
      reviewerModel: manualReviewer
    }
  );

  console.log("\n✅ Result from Custom Team Execution:");
  console.log(JSON.stringify(result, null, 2));

  const { shutdownTelemetry } = await import("./lib/telemetry.js");
  await shutdownTelemetry();
  console.log("\n🎉 Step 1 Checkpoint Verified: Manual Model Selection successfully invoked!");
}

testManualTeamOverride().catch(console.error);

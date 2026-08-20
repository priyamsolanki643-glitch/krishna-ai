import { runDebateLoop } from "./pipeline/loop.js";
import { setMockScenario } from "./lib/groq.js";

async function testCriticStage() {
  console.log("=================================================================");
  console.log("🧪 TESTING CRITIC REJECTION & PUSHBACK RETRY");
  console.log("=================================================================");

  delete process.env.GROQ_API_KEY;
  setMockScenario("critic_reject_test");

  const result = await runDebateLoop(
    "Explain quicksort partition edge cases.",
    undefined,
    async (evt) => {
      console.log(`   [SSE Event] Round ${evt.round} - ${evt.stage}:`, JSON.stringify(evt.data || {}));
    }
  );

  console.log("\n✅ Result from Critic Pushback Loop:");
  console.log(JSON.stringify(result, null, 2));

  if (!result.critic_flagged) {
    throw new Error("FAILED: Result should have critic_flagged: true");
  }

  if (!result.finalDraft.includes("Revised draft addressing duplicate keys")) {
    throw new Error("FAILED: Lead did not revise with Critic objection context");
  }

  console.log("\n🎉 Critic Stage Rejection & Pushback Test Passed with critic_flagged: true!");
}

testCriticStage().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});

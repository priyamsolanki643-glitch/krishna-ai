import { runDebateLoop } from "./pipeline/loop.js";
import { setMockScenario } from "./lib/groq.js";

delete process.env.GROQ_API_KEY;

async function runStressTests() {
  console.log("=================================================================");
  console.log("🧪 STRESS-TESTING THE COUNCIL DEBATE LOOP LOGIC (MOCK MODE)");
  console.log("=================================================================\n");


  // TEST 1: Rejection -> Multi-round Revision -> Approval
  console.log("▶️ TEST 1: Rejection on Round 1 -> Lead Revises with Context -> Approved on Round 2");
  setMockScenario("reject_then_approve");
  const res1 = await runDebateLoop(
    "What is the worst case of quicksort?",
    "Direct and technical",
    async (evt) => {
      console.log(`   [SSE thinking] Round ${evt.round} - ${evt.stage}:`, JSON.stringify(evt.data || {}));
    }
  );
  console.log("   ✅ Result 1:", JSON.stringify(res1, null, 2));
  if (res1.rounds !== 2 || res1.stopReason !== "approved") {
    throw new Error(`Test 1 Failed: Expected rounds=2 and stopReason=approved, got rounds=${res1.rounds}, reason=${res1.stopReason}`);
  }
  console.log("\n-----------------------------------------------------------------\n");

  // TEST 2: Confidence-Delta Convergence (|Δ| < 0.05)
  console.log("▶️ TEST 2: Reviewer Rejects -> Lead Confidence Delta < 0.05 (0.85 -> 0.87, delta = 0.02)");
  setMockScenario("convergence_test");
  const res2 = await runDebateLoop(
    "Explain binary search tree balancing",
    "Precise",
    async (evt) => {
      console.log(`   [SSE thinking] Round ${evt.round} - ${evt.stage}:`, JSON.stringify(evt.data || {}));
    }
  );
  console.log("   ✅ Result 2:", JSON.stringify(res2, null, 2));
  if (res2.rounds !== 2 || res2.stopReason !== "converged") {
    throw new Error(`Test 2 Failed: Expected rounds=2 and stopReason=converged, got rounds=${res2.rounds}, reason=${res2.stopReason}`);
  }
  console.log("\n-----------------------------------------------------------------\n");

  // TEST 3: Safety Ceiling (Hard Stop at 5 Rounds)
  console.log("▶️ TEST 3: Persistent Rejection without Convergence -> Max Rounds Hard Ceiling (5 rounds)");
  setMockScenario("max_rounds_test");
  const res3 = await runDebateLoop(
    "Complex philosophical paradox",
    "Analytical",
    async (evt) => {
      console.log(`   [SSE thinking] Round ${evt.round} - ${evt.stage}:`, JSON.stringify(evt.data || {}));
    }
  );
  console.log("   ✅ Result 3:", JSON.stringify(res3, null, 2));
  if (res3.rounds !== 5 || res3.stopReason !== "max_rounds_hit") {
    throw new Error(`Test 3 Failed: Expected rounds=5 and stopReason=max_rounds_hit, got rounds=${res3.rounds}, reason=${res3.stopReason}`);
  }
  console.log("\n-----------------------------------------------------------------\n");

  // TEST 4: Immediate Approval on Round 1
  console.log("▶️ TEST 4: Clean Immediate Approval on Round 1");
  setMockScenario("default");
  const res4 = await runDebateLoop(
    "What is the time complexity of quicksort in the worst case?",
    "Technical"
  );
  console.log("   ✅ Result 4:", JSON.stringify(res4, null, 2));
  if (res4.rounds !== 1 || res4.stopReason !== "approved") {
    throw new Error(`Test 4 Failed: Expected rounds=1 and stopReason=approved, got rounds=${res4.rounds}, reason=${res4.stopReason}`);
  }
  console.log("\n-----------------------------------------------------------------\n");


  // TEST 5: Circuit Breaker
  console.log("▶️ TEST 5: Circuit Breaker on Lead Agent (Forced Throw)");
  setMockScenario("circuit_breaker_test");
  const res5 = await runDebateLoop(
    "Test Circuit Breaker",
    "Technical",
    async (evt) => {
      console.log(`   [SSE thinking] Round ${evt.round} - ${evt.stage}:`, JSON.stringify(evt.data || {}));
    }
  );
  console.log("   ✅ Result 5:", JSON.stringify(res5, null, 2));
  if (res5.stopReason !== "agent_failure_circuit_breaker") {
    throw new Error(`Test 5 Failed: Expected stopReason=agent_failure_circuit_breaker, got ${res5.stopReason}`);
  }

  // TEST 6: Helper Agent Spawning
  console.log("▶️ TEST 6: Bounded Helper Agent Spawning");
  setMockScenario("helper_spawn_test");
  const res6 = await runDebateLoop(
    "How to mitigate quicksort worst case?",
    "Technical",
    async (evt) => {
      console.log(`   [SSE thinking] Round ${evt.round} - ${evt.stage}:`, JSON.stringify(evt.data || {}));
    }
  );
  console.log("   ✅ Result 6:", JSON.stringify(res6, null, 2));
  if (res6.stopReason !== "approved" || res6.rounds !== 1) {
    throw new Error(`Test 6 Failed: Expected rounds=1 and stopReason=approved, got rounds=${res6.rounds}, reason=${res6.stopReason}`);
  }

  console.log("\n=================================================================");
  console.log("🎉 ALL 6 LOOP STRESS-TEST SCENARIOS PASSED WITH EXACT CONVERGENCE!");
  console.log("=================================================================");
}

runStressTests().catch((err) => {
  console.error("❌ Stress test failed:", err);
  process.exit(1);
});

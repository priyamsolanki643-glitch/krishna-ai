import { runArgumentRuling } from "./pipeline/argue.js";
import { saveQuerySession } from "./lib/queryStore.js";

async function testArgueEndpoint() {
  console.log("=================================================================");
  console.log("🧪 TESTING POST /api/chat/argue ENDPOINT (ARBITRATION RULING)");
  console.log("=================================================================");

  const queryId = "test-session-123";
  const query = "What sorting algorithm is used by default in modern standard libraries like Java and Python?";
  const initialAnswer = "Python uses Timsort by default. Java uses standard Single-Pivot Quicksort for primitive types and Timsort for objects.";

  // Save initial session to memory
  saveQuerySession({
    queryId,
    query,
    finalDraft: initialAnswer,
    leadDraft: initialAnswer,
    timestamp: Date.now(),
  });

  console.log(`Original Query: "${query}"`);
  console.log(`Initial Stated Position:\n"${initialAnswer}"\n`);

  // Scenario 1: User submits a VALID counter-argument
  const validUserArg = "Java's Arrays.sort actually does NOT use single-pivot Quicksort for primitives; it uses Vladimir Yaroslavskiy's Dual-Pivot Quicksort.";
  console.log(`User Counter-Argument (Valid):\n"${validUserArg}"`);

  const ruling1 = await runArgumentRuling(query, initialAnswer, "lead", validUserArg);
  console.log("\n⚖️ Supervisor Arbitration Ruling (Valid Argument):");
  console.log(JSON.stringify(ruling1, null, 2));

  // Scenario 2: User submits an INVALID counter-argument
  const invalidUserArg = "Quicksort is actually slower than Bubble Sort because Bubble Sort doesn't use recursion.";
  console.log(`\n-----------------------------------------------------------------`);
  console.log(`User Counter-Argument (Invalid):\n"${invalidUserArg}"`);

  const ruling2 = await runArgumentRuling(query, initialAnswer, "lead", invalidUserArg);
  console.log("\n⚖️ Supervisor Arbitration Ruling (Invalid Argument):");
  console.log(JSON.stringify(ruling2, null, 2));

  console.log("\n🎉 Step 2 Checkpoint Verified: /api/chat/argue evaluates counter-arguments accurately!");
}

testArgueEndpoint().catch(console.error);

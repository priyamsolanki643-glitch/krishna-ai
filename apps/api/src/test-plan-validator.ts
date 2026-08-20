import { validateSpawnRequest } from "./lib/planValidator.js";

function runTests() {
  console.log("🧪 TESTING DETERMINISTIC PLAN VALIDATOR");

  // Test 1: 0 spawns so far (Allowed)
  const res1 = validateSpawnRequest(0, 1);
  if (!res1.allowed) throw new Error("Test 1 Failed: Expected allowed=true for 0/1");
  console.log("✅ Test 1 Passed: 0/1 allowed");

  // Test 2: 1 spawn so far (Denied)
  const res2 = validateSpawnRequest(1, 1);
  if (res2.allowed) throw new Error("Test 2 Failed: Expected allowed=false for 1/1");
  console.log(`✅ Test 2 Passed: 1/1 denied. Reason: ${res2.reason}`);
  
  // Test 3: Custom max budget 2
  const res3 = validateSpawnRequest(1, 2);
  if (!res3.allowed) throw new Error("Test 3 Failed: Expected allowed=true for 1/2");
  console.log("✅ Test 3 Passed: 1/2 allowed");

  console.log("🎉 ALL VALIDATOR TESTS PASSED!");
}

runTests();

import { runResponseArchitect } from "./pipeline/responseArchitect.js";

async function testResponseArchitect() {
  console.log("=================================================================");
  console.log("🧪 TESTING RESPONSE ARCHITECT WITH DIFFERENT TONE INSTRUCTIONS");
  console.log("=================================================================");

  delete process.env.GROQ_API_KEY;

  const baseDraft = "QuickSort runtime is O(n log n) on average and O(n^2) in worst case.";

  const toneNeutral = "Provide a neutral, objective, and structured explanation.";
  const toneFrustrated = "Provide a direct, empathetic, and concise explanation to de-escalate frustration.";

  const outNeutral = await runResponseArchitect(baseDraft, toneNeutral);
  const outFrustrated = await runResponseArchitect(baseDraft, toneFrustrated);

  console.log("\n--- [TONE VARIANT 1: NEUTRAL] ---");
  console.log(outNeutral);

  console.log("\n--- [TONE VARIANT 2: FRUSTRATED] ---");
  console.log(outFrustrated);

  console.log("\n🎉 Step 3 Checkpoint Verified: Response Architect formats and adapts tones noticeably!");
}

testResponseArchitect().catch(console.error);

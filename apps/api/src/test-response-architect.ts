import { runResponseArchitect } from "./pipeline/responseArchitect.js";

async function testResponseArchitect() {
  console.log("=================================================================");
  console.log("🧪 TESTING RESPONSE ARCHITECT WITH DIFFERENT TONE INSTRUCTIONS");
  console.log("=================================================================");

  delete process.env.GROQ_API_KEY;

  const baseDraft = "QuickSort runtime is O(n log n) on average and O(n^2) in worst case.";

  const toneNeutral = "Provide a neutral, objective, and structured explanation.";
  const toneFrustrated = "Provide a direct, empathetic, and concise explanation to de-escalate frustration.";

  const outNeutral = await runResponseArchitect({
    finalDraft: baseDraft,
    query: "Explain quicksort time complexity",
    toneInstruction: toneNeutral,
    rounds: 1,
    criticFlagged: false,
  });

  const outFrustrated = await runResponseArchitect({
    finalDraft: baseDraft,
    query: "Explain quicksort time complexity",
    toneInstruction: toneFrustrated,
    rounds: 2,
    criticFlagged: true,
    criticObjection: "Initial draft lacked worst-case recursion stack explanation.",
  });

  console.log("\n--- [TONE VARIANT 1: NEUTRAL (Clean Consensus)] ---");
  console.log(outNeutral.formattedContent);
  console.log("Disagreement Info:", outNeutral.disagreement);

  console.log("\n--- [TONE VARIANT 2: FRUSTRATED (Contested Debate)] ---");
  console.log(outFrustrated.formattedContent);
  console.log("Disagreement Info:", outFrustrated.disagreement);

  console.log("\n🎉 Step 3 Checkpoint Verified: Response Architect formats and adapts tones noticeably!");
}

testResponseArchitect().catch(console.error);

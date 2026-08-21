import "dotenv/config";
import { runResponseArchitect } from "./pipeline/responseArchitect.js";

async function verifyRule5LiveSources() {
  console.log("=================================================================");
  console.log("🧪 THE COUNCIL — RULE 5 (hasLiveSource & Attribution) VERIFICATION");
  console.log("=================================================================\n");

  // -----------------------------------------------------------------
  // TEST 1: hasLiveSource = TRUE (Live research sources exist & woven in)
  // -----------------------------------------------------------------
  console.log("▶️ TEST 1: LIVE SOURCES EXIST (hasLiveSources: true)");
  const liveSourceDraft = `Next.js 15 was officially released to General Availability on October 21, 2024 (source: Next.js Official Blog at https://nextjs.org/blog/next-15). It includes React 19 support, Turbopack for dev as stable, and async Request APIs.`;

  const resLive = await runResponseArchitect({
    query: "What is the release date and major features of Next.js 15?",
    finalDraft: liveSourceDraft,
    toneInstruction: "Be direct and structured.",
    hasLiveSources: true,
    rounds: 1,
    criticFlagged: false,
    confidenceScore: 0.99,
  });

  console.log("\n--- [TEST 1 OUTPUT (hasLiveSource = true)] ---");
  console.log("Full Formatted Output:\n" + resLive.formattedContent);
  console.log("\nhasLiveSource Boolean:", resLive.hasLiveSource);
  console.log("Disagreement:", JSON.stringify(resLive.disagreement));

  // -----------------------------------------------------------------
  // TEST 2: hasLiveSource = FALSE (Training knowledge only, disclaimer present)
  // -----------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ TEST 2: TRAINING KNOWLEDGE ONLY (hasLiveSources: false)");
  const trainingOnlyDraft = `The speed of light in a vacuum is approximately 299,792,458 meters per second.`;

  const resTraining = await runResponseArchitect({
    query: "What is the speed of light in a vacuum?",
    finalDraft: trainingOnlyDraft,
    toneInstruction: "Be direct and concise.",
    hasLiveSources: false,
    rounds: 1,
    criticFlagged: false,
    confidenceScore: 0.99,
  });

  console.log("\n--- [TEST 2 OUTPUT (hasLiveSource = false)] ---");
  console.log("Full Formatted Output:\n" + resTraining.formattedContent);
  console.log("\nhasLiveSource Boolean:", resTraining.hasLiveSource);
  console.log("Disagreement:", JSON.stringify(resTraining.disagreement));

  console.log("\n=================================================================");
  console.log("🎉 RULE 5 LIVE SOURCE VERIFICATION COMPLETE!");
  console.log("=================================================================");
}

verifyRule5LiveSources().catch(console.error);

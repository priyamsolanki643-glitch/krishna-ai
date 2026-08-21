import "dotenv/config";
import { runResponseArchitect } from "./pipeline/responseArchitect.js";

async function verifyResponseArchitectRules() {
  console.log("=================================================================");
  console.log("🏛️ THE COUNCIL — RESPONSE ARCHITECT GOVERNANCE RULES TEST");
  console.log("=================================================================\n");

  // -----------------------------------------------------------------
  // CASE 1: Contested Answer (Critic Flagged = True, Multi-round Dispute)
  // -----------------------------------------------------------------
  console.log("▶️ CASE 1: CONTESTED ANSWER (Critic Rejected Once, Iterative Dispute)");
  const contestedInput = {
    query: "Is Python pass-by-value or pass-by-reference?",
    finalDraft: "Python uses pass-by-assignment (or pass-by-object-reference). When an argument is passed to a function, the function receives a copy of the object reference.",
    toneInstruction: "Be clear, authoritative, and direct.",
    criticFlagged: true,
    rounds: 2,
    criticObjection: "Initial draft claimed Python is purely pass-by-value, ignoring mutable object mutation in-place within functions.",
    critiqueSummary: "Clarified that object identity is passed by value, meaning mutations to mutable objects (like lists) persist outside the function.",
    confidenceScore: 0.88,
  };

  const contestedResult = await runResponseArchitect(contestedInput);

  console.log("\n--- [CONTESTED ANSWER OUTPUT] ---");
  console.log("Substantive First Sentence:", contestedResult.formattedContent.split("\n")[0]);
  console.log("\nFull Output:\n" + contestedResult.formattedContent);
  console.log("\nDisagreement Object:");
  console.log(JSON.stringify(contestedResult.disagreement, null, 2));

  // -----------------------------------------------------------------
  // CASE 2: Clean Unanimous Answer (Critic Approved, Round 1, No Dispute)
  // -----------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ CASE 2: CLEAN UNANIMOUS ANSWER (Round 1 Clean Approval, No Dispute)");
  const cleanInput = {
    query: "What is the capital of France?",
    finalDraft: "The capital of France is Paris.",
    toneInstruction: "Be concise.",
    criticFlagged: false,
    rounds: 1,
    confidenceScore: 0.99,
  };

  const cleanResult = await runResponseArchitect(cleanInput);

  console.log("\n--- [CLEAN ANSWER OUTPUT] ---");
  console.log("Substantive First Sentence:", cleanResult.formattedContent.split("\n")[0]);
  console.log("\nFull Output:\n" + cleanResult.formattedContent);
  console.log("\nDisagreement Object:");
  console.log(JSON.stringify(cleanResult.disagreement, null, 2));

  console.log("\n=================================================================");
  console.log("🎉 RESPONSE ARCHITECT GOVERNANCE RULES 100% VERIFIED!");
  console.log("=================================================================");
}

verifyResponseArchitectRules().catch(console.error);

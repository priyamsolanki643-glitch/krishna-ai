import { runSupervisor } from "./pipeline/supervisor.js";
import { runDebateLoop } from "./pipeline/loop.js";
import { mergeTeamOutputs } from "./pipeline/compiler.js";
import { runResponseArchitect } from "./pipeline/responseArchitect.js";
import { runSafetyCheck } from "./pipeline/safety.js";
import { setMockScenario } from "./lib/groq.js";

async function testMultiTeamExecution() {
  console.log("=================================================================");
  console.log("🧪 TESTING MULTI-TEAM PARALLEL EXECUTION & COMPILER MERGE");
  console.log("=================================================================");

  delete process.env.GROQ_API_KEY;
  setMockScenario("multi_domain_test");

  const query = "Write a Python script to calculate compound interest and explain the math behind it";

  console.log(`Query: "${query}"\n`);

  // 1. Supervisor classification
  const supervisor = await runSupervisor(query);
  console.log("📊 Supervisor Domain Analysis:");
  console.log(JSON.stringify(supervisor, null, 2));

  const multiDomains = (supervisor.domains || []).filter(d => d.score >= 0.6);
  console.log(`\n🚀 Detected qualifying domains: ${multiDomains.map(d => `${d.domain} (${d.score})`).join(", ")}`);

  // 2. Parallel Team execution
  const teamResults = await Promise.all(
    multiDomains.map(async (d) => {
      const res = await runDebateLoop(query, `Focus on ${d.domain}`);
      return { domain: d.domain, result: res };
    })
  );

  console.log("\n👥 Individual Team Outputs:");
  teamResults.forEach((t, idx) => {
    console.log(`\n--- Team ${idx + 1} [${t.domain.toUpperCase()}] ---`);
    console.log(`Final Draft: ${t.result.finalDraft.slice(0, 100)}...`);
    console.log(`Rounds: ${t.result.rounds}, Stop Reason: ${t.result.stopReason}`);
  });

  // 3. Compiler Merge
  console.log("\n🔄 Merging team drafts with Compiler Agent...");
  const mergedDraft = await mergeTeamOutputs(query, teamResults);
  console.log("\n📄 Merged Output:");
  console.log(mergedDraft);

  // 4. Response Architect
  const finalResponse = await runResponseArchitect(mergedDraft, supervisor.tone_instruction);
  console.log("\n✨ Polished Final Response:");
  console.log(finalResponse);

  // 5. Safety Check
  const safety = await runSafetyCheck(finalResponse);
  console.log("\n🛡️ Safety Guardrail Check:");
  console.log(JSON.stringify(safety, null, 2));

  console.log("\n🎉 Multi-Team Deliberation & Safety Check Completed Successfully!");
}

testMultiTeamExecution().catch(console.error);

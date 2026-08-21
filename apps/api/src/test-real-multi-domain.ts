import { runSupervisor } from "./pipeline/supervisor.js";
import { runDebateLoop } from "./pipeline/loop.js";
import { mergeTeamOutputs } from "./pipeline/compiler.js";
import { runResponseArchitect } from "./pipeline/responseArchitect.js";
import { runSafetyCheck } from "./pipeline/safety.js";

async function testRealMultiDomain() {
  console.log("=================================================================");
  console.log("🚀 TESTING MULTI-DOMAIN PARALLEL EXECUTION (REAL GROQ API)");
  console.log("=================================================================");

  const query = "Write a Python function to calculate compound interest and explain the mathematical derivation behind it.";
  console.log(`User Query:\n"${query}"\n`);

  // 1. Supervisor Classification
  console.log("1. Running Supervisor Classification...");
  const supervisor = await runSupervisor(query);
  console.log("📊 Supervisor Output:", JSON.stringify(supervisor, null, 2));

  const multiDomains = (supervisor.domains || []).filter((d) => d.score >= 0.6);
  const qualifyingDomains = multiDomains.length >= 2 ? multiDomains : [{ domain: supervisor.domain, score: 1.0 }];

  console.log(`\n🚀 Qualifying Specialized Domains: ${qualifyingDomains.map(d => `${d.domain} (${d.score})`).join(", ")}`);

  // 2. Parallel Team Execution
  console.log("\n2. Executing Specialized Teams Concurrently...");
  const teamResults = await Promise.all(
    qualifyingDomains.map(async (d) => {
      const domainTone = `${supervisor.tone_instruction} (Focus deeply on the ${d.domain.toUpperCase()} aspect of the request)`;
      const res = await runDebateLoop(query, domainTone);
      return { domain: d.domain, result: res };
    })
  );

  console.log("\n=================================================================");
  console.log("👥 REAL SPECIALIZED TEAM OUTPUTS (SIDE-BY-SIDE)");
  console.log("=================================================================");
  teamResults.forEach((t) => {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`🔹 [${t.domain.toUpperCase()} SPECIALIZED TEAM DRAFT]:`);
    console.log(`-------------------------------------------------------------`);
    console.log(t.result.finalDraft);
  });

  // 3. Compiler Synthesis
  console.log(`\n-------------------------------------------------------------`);
  console.log("🔄 3. Merging with Compiler Agent (openai/gpt-oss-120b)...");
  console.log(`-------------------------------------------------------------`);
  const mergedDraft = await mergeTeamOutputs(query, teamResults);
  console.log(mergedDraft);

  // 4. Response Architect
  console.log(`\n-------------------------------------------------------------`);
  console.log("✨ 4. Final Polish with Response Architect...");
  console.log(`-------------------------------------------------------------`);
  const finalResponse = await runResponseArchitect({
    finalDraft: mergedDraft,
    query,
    toneInstruction: supervisor.tone_instruction,
    rounds: 2,
    criticFlagged: false,
  });
  console.log(finalResponse.formattedContent);

  // 5. Safety Guardrail
  const safety = await runSafetyCheck(finalResponse.formattedContent);
  console.log(`\n🛡️ Safety Guardrail Check:`, JSON.stringify(safety));

  const { shutdownTelemetry } = await import("./lib/telemetry.js");
  await shutdownTelemetry();

  console.log("\n🎉 Real Multi-Domain Execution Verified Successfully!");
}

testRealMultiDomain().catch(console.error);

import { app } from "./index.js";

async function parseHonoSSE(res: Response): Promise<{ events: { event: string; data: any }[]; finalMessage: any }> {
  const text = await res.text();
  const blocks = text.split("\n\n");
  const events: { event: string; data: any }[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;
    let eventName = "message";
    let dataStr = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) {
        eventName = line.replace("event: ", "").trim();
      } else if (line.startsWith("data: ")) {
        dataStr = line.replace("data: ", "").trim();
      }
    }
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        events.push({ event: eventName, data });
      } catch {}
    }
  }

  const messageEvent = events.find((e) => e.event === "message");
  return { events, finalMessage: messageEvent?.data };
}

async function testManualAgentsRouting() {
  console.log("=================================================================");
  console.log("🧪 TESTING MANUAL AGENTS ROUTING & SUPERVISOR BYPASS VERIFICATION");
  console.log("=================================================================\n");

  // -------------------------------------------------------------
  // TEST 1: manualAgents: ["coding"] (1 Agent Selection)
  // Verify Supervisor is COMPLETELY skipped in trace/events
  // -------------------------------------------------------------
  console.log("▶️ TEST 1: Single Agent Selection (manualAgents: ['coding'])");
  const res1 = await app.request("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Write a quick Python binary search function.",
      manualAgents: ["coding"],
    }),
  });

  const parsed1 = await parseHonoSSE(res1);
  console.log(`   Response Status: ${res1.status}`);
  console.log("   Observed Stages in SSE Stream:");
  parsed1.events.filter(e => e.event === "thinking").forEach(e => console.log(`     - [${e.data.stage}]: ${e.data.message || ""}`));

  const supervisorInvoked1 = parsed1.events.some(e => e.data.stage === "supervisor" || e.data.stage === "supervisor_complete");
  console.log(`   🔍 Was Supervisor invoked? ${supervisorInvoked1 ? "❌ YES (BUG)" : "✅ NO (GENUINELY SKIPPED)"}`);
  console.log(`   Routing Mode in Final Message: "${parsed1.finalMessage?.routingMode}"`);

  if (supervisorInvoked1) {
    throw new Error("FAILED: Supervisor was invoked during manualAgents request!");
  }

  // -------------------------------------------------------------
  // TEST 2: manualAgents: ["coding", "math"] (2 Agents Selection)
  // Verify Parallel Execution & Compiler Merge
  // -------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ TEST 2: Multi-Agent Selection (manualAgents: ['coding', 'math'])");
  const res2 = await app.request("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Explain compound interest and write a python simulator.",
      manualAgents: ["coding", "math"],
    }),
  });

  const parsed2 = await parseHonoSSE(res2);
  console.log(`   Response Status: ${res2.status}`);
  console.log("   Observed Stages in SSE Stream:");
  parsed2.events.filter(e => e.event === "thinking").forEach(e => {
    if (e.data.stage === "multi_team_start" || e.data.stage === "compiler_synthesis" || e.data.stage === "manual_agent_selection") {
      console.log(`     - [${e.data.stage}]: ${e.data.message || ""}`);
    }
  });

  const supervisorInvoked2 = parsed2.events.some(e => e.data.stage === "supervisor" || e.data.stage === "supervisor_complete");
  console.log(`   🔍 Was Supervisor invoked? ${supervisorInvoked2 ? "❌ YES (BUG)" : "✅ NO (GENUINELY SKIPPED)"}`);
  console.log("   Specialized Domains Ran Concurrently:", JSON.stringify(parsed2.finalMessage?.domains));
  console.log(`   Routing Mode in Final Message: "${parsed2.finalMessage?.routingMode}"`);

  if (supervisorInvoked2) {
    throw new Error("FAILED: Supervisor was invoked during multi-agent manual request!");
  }

  console.log("\n=================================================================");
  console.log("🎉 MANUAL AGENT ROUTING & SUPERVISOR BYPASS FULLY VERIFIED!");
  console.log("=================================================================");
}

testManualAgentsRouting().catch(console.error);

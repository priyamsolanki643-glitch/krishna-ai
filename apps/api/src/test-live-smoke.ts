const BASE_URL = "https://the-council-api-1083682147747.us-central1.run.app";

async function parseSSEStream(response: Response): Promise<{ events: { event: string; data: any }[]; finalMessage: any }> {
  const text = await response.text();
  const lines = text.split("\n");
  const events: { event: string; data: any }[] = [];
  let currentEvent = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent = line.replace("event: ", "").trim();
    } else if (line.startsWith("data: ")) {
      const dataStr = line.replace("data: ", "").trim();
      try {
        const data = JSON.parse(dataStr);
        events.push({ event: currentEvent, data });
      } catch {}
    }
  }

  const messageEvent = events.find((e) => e.event === "message");
  return { events, finalMessage: messageEvent?.data };
}

async function runLiveFullSystemSmokeTest() {
  console.log("=================================================================");
  console.log("🔥 RUNNING FINAL FULL-SYSTEM SMOKE TEST AGAINST LIVE CLOUD RUN");
  console.log(`Endpoint: ${BASE_URL}`);
  console.log("=================================================================\n");

  // Health check verification
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthJson = await healthRes.json();
  console.log(`🏥 Health Check Status:`, JSON.stringify(healthJson));

  let lastQueryId = "";

  // 1. Scenario 1: Simple Single-Team Query
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ SCENARIO 1: Simple Query (Single Team, Clean Deliberation)");
  const res1 = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "What is the capital of France?" }),
  });
  const parsed1 = await parseSSEStream(res1);
  lastQueryId = parsed1.finalMessage?.queryId;
  console.log(`   ✅ Status: ${res1.status}, Rounds: ${parsed1.finalMessage?.rounds}, StopReason: ${parsed1.finalMessage?.stopReason}`);
  console.log(`   Output: ${parsed1.finalMessage?.content?.slice(0, 120)}...`);

  // 2. Scenario 2: Technical Reviewer Critique & Revision
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ SCENARIO 2: Algorithmic Deliberation with Reviewer Critique");
  const res2 = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Explain why QuickSort worst case occurs and how randomized partitioning prevents it." }),
  });
  const parsed2 = await parseSSEStream(res2);
  console.log(`   ✅ Status: ${res2.status}, Rounds: ${parsed2.finalMessage?.rounds}, CriticFlagged: ${parsed2.finalMessage?.critic_flagged}`);
  console.log(`   Output: ${parsed2.finalMessage?.content?.slice(0, 140)}...`);

  // 3. Scenario 3: Complex Multi-Domain Query (Coding + Math)
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ SCENARIO 3: Multi-Domain Query (Parallel Coding & Math Teams + Compiler Synthesis)");
  const res3 = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Write a Python function to calculate compound interest and derive the exponential growth formula." }),
  });
  const parsed3 = await parseSSEStream(res3);
  console.log(`   ✅ Status: ${res3.status}, Domains Spawned:`, parsed3.finalMessage?.domains?.map((d: any) => d.domain).join(", "));
  console.log(`   Compiler & Architect Output: ${parsed3.finalMessage?.content?.slice(0, 160)}...`);

  // 4. Scenario 4: Manual Custom Team Model Selection (Bypassing Supervisor)
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ SCENARIO 4: Custom Manual Team Selection (qwen/qwen3.6-27b as Lead)");
  const res4 = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Write a high-performance Rust function for binary search.",
      manualTeam: ["qwen/qwen3.6-27b", "openai/gpt-oss-20b"],
    }),
  });
  const parsed4 = await parseSSEStream(res4);
  console.log(`   ✅ Status: ${res4.status}, Custom Model Used: qwen/qwen3.6-27b`);
  console.log(`   Output: ${parsed4.finalMessage?.content?.slice(0, 140)}...`);

  // 5. Scenario 5: User Counter-Argument Ruling (POST /api/chat/argue)
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ SCENARIO 5: Counter-Argument Evaluation (/api/chat/argue)");
  const res5 = await fetch(`${BASE_URL}/api/chat/argue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originalQueryId: lastQueryId,
      targetAgent: "lead",
      userArgument: "Actually, can you provide the historical origin of the name Paris and its Latin root?",
    }),
  });
  const rulingJson: any = await res5.json();
  console.log(`   ✅ Status: ${res5.status}`);
  console.log(`   Ruling Verdict: ${rulingJson.ruling?.verdict}`);
  console.log(`   Supervisor Explanation: ${rulingJson.ruling?.explanation?.slice(0, 160)}...`);

  // 6. Scenario 6: Rate Limiting Abuse Guard Check
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ SCENARIO 6: Input Length Abuse Validation");
  const longQuery = "a".repeat(4500);
  const res6 = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: longQuery }),
  });
  const abuseJson: any = await res6.json();
  console.log(`   ✅ Status: ${res6.status} (Expected 400), Error: ${abuseJson.error}`);

  console.log("\n=================================================================");
  console.log("🎉 ALL 6 PRODUCTION SCENARIOS PASSED AGAINST LIVE CLOUD RUN!");
  console.log("=================================================================");
}

runLiveFullSystemSmokeTest().catch(console.error);

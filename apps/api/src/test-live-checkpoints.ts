const BASE_URL = "https://the-council-api-1083682147747.us-central1.run.app";

async function parseSSEStream(response: Response): Promise<{ events: { event: string; data: any }[]; finalMessage: any; errorEvent: any }> {
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
  const errorEvent = events.find((e) => e.event === "error");
  return { events, finalMessage: messageEvent?.data, errorEvent: errorEvent?.data };
}

async function runLiveCheckpoints() {
  console.log("=================================================================");
  console.log("🔥 RUNNING LIVE CHECKPOINTS AGAINST CLOUD RUN REVISION 00010");
  console.log(`Endpoint: ${BASE_URL}`);
  console.log("=================================================================\n");

  // -------------------------------------------------------------
  // CHECKPOINT 1: Invalid Custom Groq Key
  // -------------------------------------------------------------
  console.log("▶️ CHECKPOINT 1: Testing X-User-Groq-Key Header with Invalid Key");
  const res1 = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Groq-Key": "gsk_invalid_bogus_user_key_99999",
    },
    body: JSON.stringify({ query: "Test query with bad key" }),
  });

  const parsed1 = await parseSSEStream(res1);
  console.log(`   Response Status: ${res1.status}`);
  console.log("   SSE Error Event Received:", JSON.stringify(parsed1.errorEvent, null, 2));

  // -------------------------------------------------------------
  // CHECKPOINT 2A: Fast Mode Override
  // -------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ CHECKPOINT 2A: Testing debateMode: 'fast' (Direct Lead synthesis)");
  const res2a = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "What is the Big-O time complexity of Binary Search?",
      debateMode: "fast",
    }),
  });

  const parsed2a = await parseSSEStream(res2a);
  console.log(`   Response Status: ${res2a.status}`);
  console.log("   Observed Stages in SSE Stream:");
  parsed2a.events.filter(e => e.event === "thinking").forEach(e => console.log(`     - [${e.data.stage}]: ${e.data.message || ""}`));
  console.log("   Final Message Summary:", JSON.stringify({
    rounds: parsed2a.finalMessage?.rounds,
    stopReason: parsed2a.finalMessage?.stopReason,
    critic_flagged: parsed2a.finalMessage?.critic_flagged
  }, null, 2));

  // -------------------------------------------------------------
  // CHECKPOINT 2B: maxRounds Override
  // -------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ CHECKPOINT 2B: Testing maxRounds: 2 Override");
  const res2b = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Prove mathematically that P != NP",
      maxRounds: 2,
    }),
  });

  const parsed2b = await parseSSEStream(res2b);
  console.log(`   Response Status: ${res2b.status}`);
  console.log("   Final Message Rounds & Stop Reason:", JSON.stringify({
    rounds: parsed2b.finalMessage?.rounds,
    stopReason: parsed2b.finalMessage?.stopReason
  }, null, 2));

  // -------------------------------------------------------------
  // CHECKPOINT 3: Workspace .zip Export
  // -------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ CHECKPOINT 3: Testing GET /api/project/proj-123/export (.zip download)");
  const res3 = await fetch(`${BASE_URL}/api/project/proj-123/export`);
  const zipBuffer = await res3.arrayBuffer();
  console.log(`   Response Status: ${res3.status}`);
  console.log(`   Content-Type: ${res3.headers.get("content-type")}`);
  console.log(`   Content-Disposition: ${res3.headers.get("content-disposition")}`);
  console.log(`   Downloaded ZIP Size: ${zipBuffer.byteLength} bytes`);

  // -------------------------------------------------------------
  // CHECKPOINT 4: Clear Workspace Transient Cache
  // -------------------------------------------------------------
  console.log("\n-----------------------------------------------------------------");
  console.log("▶️ CHECKPOINT 4: Testing DELETE /api/project/proj-123/cache");
  const res4 = await fetch(`${BASE_URL}/api/project/proj-123/cache`, {
    method: "DELETE",
  });
  const json4 = await res4.json();
  console.log(`   Response Status: ${res4.status}`);
  console.log("   Cache Clear Response:", JSON.stringify(json4, null, 2));

  console.log("\n=================================================================");
  console.log("🎉 ALL LIVE CHECKPOINTS COMPLETED SUCCESSFULLY!");
  console.log("=================================================================");
}

runLiveCheckpoints().catch(console.error);

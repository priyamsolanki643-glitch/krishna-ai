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

async function testArgueWithOwnQuery() {
  console.log("=================================================================");
  console.log("🧪 TESTING LIVE ARGUE ENDPOINT WITH DEDICATED FRESH QUERY");
  console.log("=================================================================\n");

  const testQuery = "What is the time complexity of QuickSort in the average and worst case?";
  console.log(`1. Submitting Initial Chat Request: "${testQuery}"...`);

  const chatRes = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: testQuery }),
  });

  const parsed = await parseSSEStream(chatRes);
  const queryId = parsed.finalMessage?.queryId;
  const initialAnswer = parsed.finalMessage?.content;

  console.log(`\n✅ Chat Response Received (queryId: ${queryId}):`);
  console.log(`Initial Answer Snippet:\n"${initialAnswer?.slice(0, 180)}..."\n`);

  console.log("-----------------------------------------------------------------");
  console.log("2. Submitting Counter-Argument to /api/chat/argue...");

  const userCounterArg = "Quicksort is actually always strictly O(n log n) even in the worst case if you implement it properly.";
  console.log(`User Counter-Argument:\n"${userCounterArg}"\n`);

  const argueRes = await fetch(`${BASE_URL}/api/chat/argue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originalQueryId: queryId,
      targetAgent: "lead",
      userArgument: userCounterArg,
    }),
  });

  const argueJson = await argueRes.json();

  console.log(`✅ Ruling Response Status: ${argueRes.status}`);
  console.log("⚖️ Actual Arbitration Ruling JSON:");
  console.log(JSON.stringify(argueJson, null, 2));

  console.log("\n=================================================================");
  console.log("🎉 Real-Time Argue Test Completed against Live Cloud Run!");
  console.log("=================================================================");
}

testArgueWithOwnQuery().catch(console.error);

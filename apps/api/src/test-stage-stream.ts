async function testCouncilDebugStages() {
  console.log("=================================================================");
  console.log("🔍 TESTING COUNCIL VIEW DEBUG STAGES STREAMING");
  console.log("=================================================================\n");

  const baseUrl = "https://the-council-api-1083682147747.us-central1.run.app";
  const res = await fetch(`${baseUrl}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Is Python pass-by-value or pass-by-reference?",
      debateMode: "deep",
      maxRounds: 2,
    }),
  });

  console.log(`HTTP Status: ${res.status}`);
  if (!res.body) throw new Error("No body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

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

      if (!dataStr) continue;

      try {
        const data = JSON.parse(dataStr);
        if (eventName === "thinking") {
          console.log(`\n[THINKING STAGE: ${data.stage}]`);
          if (data.domain) console.log(`  - Domain: ${data.domain}`);
          if (data.data?.content) console.log(`  - Draft Content: "${data.data.content.slice(0, 80)}..."`);
          if (data.data?.objection || data.data?.issue) console.log(`  - Critic Objection: "${data.data.objection || data.data.issue}"`);
        } else if (eventName === "message") {
          console.log(`\n[FINAL MESSAGE EVENT]`);
          console.log(`  - Domain: ${data.domain}`);
          console.log(`  - Rounds: ${data.rounds}`);
          console.log(`  - Disagreement:`, data.disagreement);
          console.log(`  - Content: "${data.content.slice(0, 100)}..."`);
        }
      } catch (e) {}
    }
  }
}

testCouncilDebugStages().catch(console.error);

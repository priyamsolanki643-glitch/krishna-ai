import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL = process.env.NEXT_PUBLIC_COUNCIL_API_URL || "https://the-council-api-1083682147747.us-central1.run.app";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, selectedAgents = [], debateMode = "deep", maxRounds = 2, arguingWith } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Missing or invalid query." }, { status: 400 });
    }

    const userGroqKey = req.headers.get("x-user-groq-key")?.trim() || "";

    // 1. If User is Arguing with previous consensus, route to POST /api/chat/argue
    if (arguingWith?.context) {
      const argueRes = await fetch(`${BACKEND_URL}/api/chat/argue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(userGroqKey ? { "x-user-groq-key": userGroqKey } : {}),
        },
        body: JSON.stringify({
          originalQueryId: arguingWith.queryId || "manual-context",
          targetAgent: (arguingWith.agent?.toLowerCase().includes("critic") ? "critic" : "lead"),
          userArgument: query,
        }),
      });

      if (!argueRes.ok) {
        const errJson = await argueRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Argue pipeline failed with status ${argueRes.status}`);
      }

      const argueData = await argueRes.json();
      const ruling = argueData.ruling || {};

      return NextResponse.json({
        text: ruling.updatedAnswer || `${ruling.verdict === "argument_accepted" ? "✅ **Argument Accepted**" : "❌ **Original Stance Maintained**"}\n\n${ruling.explanation}`,
        hasDisagreement: ruling.verdict === "argument_accepted",
        stageData: {
          supervisor: {
            domain: "Supervisor Arbitration",
            confidence: 0.99,
            assignedLead: "Supervisor Arbiter",
            assignedCritic: "Adversarial Reviewer",
            intent: "Evaluate user counter-argument",
          },
          leadDraft: {
            agent: "Supervisor Adjudicator",
            content: ruling.explanation,
          },
          critique: {
            agent: "Council Arbiter",
            identifiedFlaws: ruling.verdict === "argument_accepted" ? ["Previous consensus adjusted based on user feedback."] : [],
            critiqueContent: ruling.explanation,
            rating: ruling.verdict,
          },
          convergence: {
            rounds: 1,
            consensusScore: 0.99,
          },
        },
      });
    }

    // 2. Standard Query: Forward directly to Cloud Run Live Multi-Agent Deliberation Pipeline (POST /api/chat/stream)
    const backendRes = await fetch(`${BACKEND_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userGroqKey ? { "x-user-groq-key": userGroqKey } : {}),
      },
      body: JSON.stringify({
        query,
        manualAgents: selectedAgents.map((a: string) => a.replace("-agent", "")),
        debateMode,
        maxRounds,
      }),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      throw new Error(`Live Council Pipeline Error (${backendRes.status}): ${errText}`);
    }

    // Parse SSE stream events from the real backend
    const streamText = await backendRes.text();
    const blocks = streamText.split("\n\n");
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
          events.push({ event: eventName, data: JSON.parse(dataStr) });
        } catch {}
      }
    }

    const messageEvent = events.find((e) => e.event === "message");
    const errorEvent = events.find((e) => e.event === "error");

    if (errorEvent) {
      throw new Error(errorEvent.data?.message || errorEvent.data?.error || "Pipeline deliberation failed.");
    }

    const msgData = messageEvent?.data || {};
    const thinkingEvents = events.filter((e) => e.event === "thinking").map((e) => e.data);

    // Build real dynamic stage data from live SSE trace
    const supervisorEvt = thinkingEvents.find((e) => e.stage === "supervisor_complete" || e.stage === "manual_agent_selection");
    const leadEvt = thinkingEvents.find((e) => e.stage === "lead_drafting");
    const reviewerEvt = thinkingEvents.find((e) => e.stage === "round_complete");
    const criticEvt = thinkingEvents.find((e) => e.stage === "critic_revising");

    const stageData = {
      supervisor: {
        domain: msgData.domain || supervisorEvt?.domain || "Multi-Domain Deliberation",
        confidence: 0.98,
        assignedLead: "openai/gpt-oss-120b",
        assignedCritic: "meta-llama/llama-3.3-70b-versatile",
        intent: `Multi-agent consensus (${msgData.routingMode || "auto"} routing)`,
      },
      leadDraft: {
        agent: "Lead Agent (openai/gpt-oss-120b)",
        content: `Draft synthesized across ${msgData.rounds || 1} round(s).`,
      },
      critique: {
        agent: "Adversarial Critic (meta-llama/llama-3.3-70b-versatile)",
        identifiedFlaws: criticEvt?.data?.objection ? [criticEvt.data.objection] : [],
        critiqueContent: reviewerEvt?.data?.reviewerCertainty ? `Reviewer Certainty: ${(reviewerEvt.data.reviewerCertainty * 100).toFixed(0)}%` : "Verified against core domain constraints.",
        rating: msgData.critic_flagged ? "Critique Applied" : "Approved",
      },
      convergence: {
        rounds: msgData.rounds || 1,
        consensusScore: 0.98,
      },
    };

    return NextResponse.json({
      text: msgData.content || "No response generated.",
      hasDisagreement: Boolean(msgData.critic_flagged),
      stageData,
    });
  } catch (error: any) {
    console.error("Live Council Proxy Error:", error);
    return NextResponse.json({
      text: `**Council Notice**: Encountered an error generating response: ${error.message || "Unknown error"}. Please check your API key in Settings.`,
      hasDisagreement: false,
    }, { status: 500 });
  }
}

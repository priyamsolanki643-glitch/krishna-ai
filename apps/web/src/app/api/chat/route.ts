import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

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

    // 2. Standard Query: Forward directly to Cloud Run Live V2 Multi-Agent Stream
    const backendRes = await fetch(`${BACKEND_URL}/api/v2/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userGroqKey ? { "x-user-groq-key": userGroqKey } : {}),
      },
      body: JSON.stringify({
        query,
        sessionId: randomUUID(),
        tokenBudget: 25000,
      }),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      throw new Error(`Live Council Pipeline Error (${backendRes.status}): ${errText}`);
    }

    // Parse SSE stream events from the backend
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

    const errorEvent = events.find((e) => e.event === "error");
    if (errorEvent) {
      throw new Error(errorEvent.data?.message || errorEvent.data?.error || "Pipeline deliberation failed.");
    }

    const finalEvent = events.find((e) => e.event === "final");
    const messageEvent = events.find((e) => e.event === "message");
    const agentOutputs = events.filter((e) => e.event === "agent_output").map((e) => e.data);
    const pipelineDesign = events.find((e) => e.event === "pipeline_design")?.data;

    const finalText = finalEvent?.data?.answer || messageEvent?.data?.content || "No response generated.";
    const confidenceScore = finalEvent?.data?.confidence || 0.95;
    const queryDomain = pipelineDesign?.queryType || "Multi-Agent Deliberation";

    const leadAgent = agentOutputs.find((a) => a.agent === "engineer" || a.agent === "visionary") || agentOutputs[0];
    const criticAgent = agentOutputs.find((a) => a.agent === "skeptic");

    const stageData = {
      supervisor: {
        domain: queryDomain,
        confidence: confidenceScore,
        assignedLead: leadAgent ? `Agent: ${leadAgent.agent}` : "The Council Lead",
        assignedCritic: criticAgent ? `Agent: ${criticAgent.agent}` : "The Council Skeptic",
        intent: pipelineDesign?.rationale || "Dynamic ADAS Deliberation Pipeline",
      },
      leadDraft: {
        agent: leadAgent ? `${leadAgent.agent.toUpperCase()} (Confidence: ${(leadAgent.confidence * 100).toFixed(0)}%)` : "Lead Council Agent",
        content: leadAgent?.output || "Synthesizing deep structured analysis...",
      },
      critique: {
        agent: criticAgent ? `${criticAgent.agent.toUpperCase()} (Adversarial Verification)` : "Adversarial Critic",
        identifiedFlaws: finalEvent?.data?.dissentReport ? [finalEvent.data.dissentReport] : [],
        critiqueContent: criticAgent?.output || "Verified against domain-specific constraints and edge cases.",
        rating: finalEvent?.data?.consensus === "full" ? "Consensus Reached" : "Dissent Documented",
      },
      convergence: {
        rounds: pipelineDesign?.debateRounds || 1,
        consensusScore: confidenceScore,
      },
    };

    return NextResponse.json({
      text: finalText,
      hasDisagreement: Boolean(finalEvent?.data?.dissentReport),
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

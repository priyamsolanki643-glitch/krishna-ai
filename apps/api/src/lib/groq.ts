import "dotenv/config";
import Groq from "groq-sdk";

let groqClient: Groq | null = null;

export function isMockMode(): boolean {
  return !process.env.GROQ_API_KEY;
}

function getGroqClient(): Groq | null {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

// Fallback test scenario state for stress-testing when no key is present
export type MockScenario = "default" | "reject_then_approve" | "convergence_test" | "max_rounds_test" | "circuit_breaker_test";
let currentMockScenario: MockScenario = "default";
let mockCallCounter = { lead: 0, reviewer: 0 };

export function setMockScenario(scenario: MockScenario) {
  currentMockScenario = scenario;
  mockCallCounter = { lead: 0, reviewer: 0 };
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string = "openai/gpt-oss-20b"
): Promise<string> {
  const client = getGroqClient();

  if (client) {
    try {
      const response = await client.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model: model || "openai/gpt-oss-20b",
      });
      return response.choices[0]?.message?.content || "";
    } catch (err: any) {
      // If higher tier model hits rate limit or error, fallback to fast 20b model
      if (model !== "openai/gpt-oss-20b") {
        console.warn(`⚠️ Groq model ${model} failed, falling back to openai/gpt-oss-20b: ${err.message}`);
        const fallbackRes = await client.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "openai/gpt-oss-20b",
        });
        return fallbackRes.choices[0]?.message?.content || "";
      }
      throw err;
    }
  }

  // Explicit, tagged fallback simulation when GROQ_API_KEY is not set
  console.warn("⚠️ MOCK MODE — no GROQ_API_KEY set (serving simulated agent response with is_mock: true)");

  if (systemPrompt.includes("Reviewer Agent") || systemPrompt.includes("verdict") || systemPrompt.includes("CritiqueOutputSchema")) {
    mockCallCounter.reviewer++;
    if (currentMockScenario === "reject_then_approve") {
      if (mockCallCounter.reviewer === 1) {
        return JSON.stringify({
          issue: "Missing explanation of worst-case pivot selection in deterministic quicksort.",
          evidence: "Deterministic quicksort triggers O(n^2) on sorted inputs unless randomized or median-of-three is used.",
          confidence: 0.90,
          suggested_fix: "Add explicit clarification on median-of-three and randomized pivot mitigation.",
          verdict: "reject",
          is_mock: true,
        });
      }
      return JSON.stringify({
        issue: "None. Revised draft completely addresses pivot selection strategies.",
        evidence: "Correct algorithmic explanation.",
        confidence: 0.99,
        suggested_fix: "None",
        verdict: "approve",
        is_mock: true,
      });
    }

    if (currentMockScenario === "convergence_test") {
      return JSON.stringify({
        issue: "Minor phrasing refinement suggested on partition boundary conditions.",
        evidence: "Partition index edge cases.",
        confidence: 0.88,
        suggested_fix: "Tighten boundary inequality definitions.",
        verdict: "reject",
        is_mock: true,
      });
    }

    if (currentMockScenario === "max_rounds_test") {
      return JSON.stringify({
        issue: "Persistent logical gap.",
        evidence: "Missing edge cases.",
        confidence: 0.95,
        suggested_fix: "Rewrite.",
        verdict: "reject",
        is_mock: true,
      });
    }

    return JSON.stringify({
      issue: "None. Explanation accurately specifies pivot imbalance conditions.",
      evidence: "Standard algorithmic analysis for deterministic quicksort without randomized partitioning.",
      confidence: 0.98,
      suggested_fix: "No changes required.",
      verdict: "approve",
      is_mock: true,
    });
  }

  if (systemPrompt.includes("Supervisor") || systemPrompt.includes("domain") || systemPrompt.includes("SupervisorOutputSchema")) {
    return JSON.stringify({
      domain: "coding",
      emotion: "neutral",
      tone_instruction: "Provide a direct, technical, and mathematically precise answer.",
      is_mock: true,
    });
  }

  if (systemPrompt.includes("Lead Agent") || systemPrompt.includes("DraftOutputSchema") || systemPrompt.includes("confidence")) {
    mockCallCounter.lead++;
    if (currentMockScenario === "convergence_test") {
      const conf = mockCallCounter.lead === 1 ? 0.85 : 0.87;
      return JSON.stringify({
        content: `Draft round ${mockCallCounter.lead}: The worst-case time complexity of QuickSort is O(n^2), occurring with unbalanced partitions.`,
        confidence: conf,
        is_mock: true,
      });
    }

    if (currentMockScenario === "circuit_breaker_test") {
      throw new Error("Simulated API failure for Circuit Breaker");
    }

    if (currentMockScenario === "max_rounds_test") {
      return JSON.stringify({
        content: `Draft round ${mockCallCounter.lead}`,
        confidence: 0.5 + mockCallCounter.lead * 0.1, // delta is 0.1, never < 0.05
        is_mock: true,
      });
    }

    return JSON.stringify({
      content: "The worst-case time complexity of QuickSort is O(n^2), which occurs when the partitioning algorithm consistently creates highly unbalanced subproblems (for example, when the smallest or largest element is repeatedly picked as pivot in an already sorted or reverse-sorted array without random pivoting).",
      confidence: 0.95,
      is_mock: true,
    });
  }

  return "Hello! Groq client is ready.";
}

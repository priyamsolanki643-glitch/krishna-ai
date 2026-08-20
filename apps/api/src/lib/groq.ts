import "dotenv/config";
import Groq from "groq-sdk";

let groqClient: Groq | null = null;

export function isMockMode(): boolean {
  return !process.env.GROQ_API_KEY;
}

function getGroqClient(apiKeyOverride?: string): Groq | null {
  if (apiKeyOverride) {
    return new Groq({ apiKey: apiKeyOverride });
  }
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

// Fallback test scenario state for stress-testing when no key is present
export type MockScenario = 
  | "default" 
  | "reject_then_approve" 
  | "convergence_test" 
  | "max_rounds_test" 
  | "circuit_breaker_test" 
  | "helper_spawn_test" 
  | "helper_spawn_denied_test"
  | "critic_reject_test"
  | "multi_domain_test";

let currentMockScenario: MockScenario = "default";
let mockCallCounter = { lead: 0, reviewer: 0, critic: 0 };

export function setMockScenario(scenario: MockScenario) {
  currentMockScenario = scenario;
  mockCallCounter = { lead: 0, reviewer: 0, critic: 0 };
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string = "openai/gpt-oss-20b",
  userGroqKey?: string
): Promise<string> {
  const client = getGroqClient(userGroqKey);

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
      if (userGroqKey) {
        // If a custom key was provided and failed, do not silently fallback to server key
        throw new Error(`Invalid Groq API key provided: ${err.message}`);
      }
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

  if (systemPrompt.includes("final adversarial Critic Agent") || systemPrompt.includes("CriticOutputSchema")) {
    mockCallCounter.critic++;
    if (currentMockScenario === "critic_reject_test") {
      return JSON.stringify({
        verdict: "reject",
        objection: "The proof fails to account for duplicate keys leading to partition degradation.",
        confidence: 0.95,
        is_mock: true,
      });
    }
    return JSON.stringify({
      verdict: "approve",
      objection: "",
      confidence: 0.98,
      is_mock: true,
    });
  }

  if (systemPrompt.includes("Response Architect")) {
    if (userPrompt.toLowerCase().includes("frustrated") || userPrompt.toLowerCase().includes("de-escalate")) {
      return `[Frustrated Tone Rewritten]: Look, here is the exact breakdown straight to the point: ${userPrompt.split("Draft to Refine:")[1]?.trim() || userPrompt}`;
    }
    return `[Architect Formatted Response]: ${userPrompt.split("Draft to Refine:")[1]?.trim() || userPrompt}`;
  }

  if (systemPrompt.includes("Compiler Agent")) {
    return `# Synthesized Multi-Domain Analysis\n\nCombined synthesis from all specialized agents:\n${userPrompt}`;
  }

  if (systemPrompt.includes("Safety Guardrail Agent")) {
    return JSON.stringify({
      is_safe: true,
      category: "benign",
      confidence: 0.99,
      is_mock: true
    });
  }

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

  if (systemPrompt.includes("acting as an impartial judge") || systemPrompt.includes("Argument Ruling")) {
    if (userPrompt.toLowerCase().includes("dual-pivot") || userPrompt.toLowerCase().includes("yaroslavskiy")) {
      return JSON.stringify({
        verdict: "argument_accepted",
        explanation: "The user is correct. Vladimir Yaroslavskiy's dual-pivot Quicksort was adopted in Java 7 because it offers fewer cache misses and superior practical performance over classical single-pivot partitioning.",
        updatedAnswer: "Java's Arrays.sort utilizes Dual-Pivot Quicksort by Vladimir Yaroslavskiy, which partitions the array into three segments using two pivots, significantly reducing memory cache misses compared to traditional Hoare or Lomuto partitioning."
      });
    }
    return JSON.stringify({
      verdict: "argument_rejected",
      explanation: "The user's objection confuses worst-case asymptotic upper bounds O(n^2) with randomized expected runtime O(n log n). The original stance correctly adheres to standard Big-O definitions."
    });
  }

  if (systemPrompt.includes("Supervisor") || systemPrompt.includes("SupervisorOutputSchema")) {
    if (currentMockScenario === "multi_domain_test" || userPrompt.includes("Python") || userPrompt.includes("compound interest")) {
      return JSON.stringify({
        domain: "coding",
        domains: [
          { domain: "coding", score: 0.9 },
          { domain: "math", score: 0.85 }
        ],
        emotion: "neutral",
        tone_instruction: "Provide clear code and mathematical derivation.",
        is_mock: true,
      });
    }
    return JSON.stringify({
      domain: "coding",
      domains: [{ domain: "coding", score: 0.95 }],
      emotion: "neutral",
      tone_instruction: "Provide a direct, technical, and mathematically precise answer.",
      is_mock: true,
    });
  }

  if (systemPrompt.includes("You are a specialized Helper Agent in The Council.")) {
    return JSON.stringify({
      result: "Median-of-three is a pivot strategy that selects the median of the first, middle, and last elements to avoid O(n^2) time on sorted data.",
      is_mock: true
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

    if (currentMockScenario === "helper_spawn_test") {
      if (mockCallCounter.lead === 1) {
        return JSON.stringify({
          content: `Draft round 1: I'm stuck on pivot strategies.`,
          confidence: 0.4,
          needs_help: true,
          help_query: "What is the median-of-three pivot strategy?",
          is_mock: true,
        });
      }
      return JSON.stringify({
        content: `Draft round 2: Median-of-three solves this.`,
        confidence: 0.95,
        is_mock: true,
      });
    }

    if (currentMockScenario === "helper_spawn_denied_test") {
      if (mockCallCounter.lead === 1) {
        return JSON.stringify({
          content: `Draft round 1: Need help.`,
          confidence: 0.4,
          needs_help: true,
          help_query: "Query 1",
          is_mock: true,
        });
      }
      if (mockCallCounter.lead === 2) {
        return JSON.stringify({
          content: `Draft round 2: Still need help.`,
          confidence: 0.5,
          needs_help: true, // Should be denied!
          help_query: "Query 2",
          is_mock: true,
        });
      }
      return JSON.stringify({
        content: `Draft round 3: Proceeding anyway.`,
        confidence: 0.95,
        is_mock: true,
      });
    }

    if (currentMockScenario === "critic_reject_test") {
      if (mockCallCounter.lead === 1) {
        return JSON.stringify({
          content: "Initial draft on QuickSort partitioning.",
          confidence: 0.90,
          is_mock: true,
        });
      }
      return JSON.stringify({
        content: "Revised draft addressing duplicate keys with 3-way Dijkstra partitioning (Dutch National Flag).",
        confidence: 0.98,
        is_mock: true,
      });
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

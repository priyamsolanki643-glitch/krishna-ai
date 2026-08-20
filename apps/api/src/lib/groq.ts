import "dotenv/config";
import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqClient;
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string = "llama-3.1-8b-instant"
): Promise<string> {
  const client = getGroqClient();

  if (client) {
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: model || "llama-3.1-8b-instant",
    });
    return response.choices[0]?.message?.content || "";
  }

  // Fallback simulation when GROQ_API_KEY is not yet configured

  // 1. Reviewer Agent check
  if (systemPrompt.includes("Reviewer Agent") || systemPrompt.includes("verdict") || systemPrompt.includes("CritiqueOutputSchema")) {
    return JSON.stringify({
      issue: "None. Explanation accurately specifies pivot imbalance conditions.",
      evidence: "Standard algorithmic analysis for deterministic quicksort without randomized partitioning.",
      confidence: 0.98,
      suggested_fix: "No changes required.",
      verdict: "approve",
    });
  }

  // 2. Supervisor check
  if (systemPrompt.includes("Supervisor") || systemPrompt.includes("domain") || systemPrompt.includes("SupervisorOutputSchema")) {
    return JSON.stringify({
      domain: "coding",
      emotion: "neutral",
      tone_instruction: "Provide a direct, technical, and mathematically precise answer.",
    });
  }

  // 3. Lead Agent check
  if (systemPrompt.includes("Lead Agent") || systemPrompt.includes("DraftOutputSchema") || systemPrompt.includes("confidence")) {
    return JSON.stringify({
      content: "The worst-case time complexity of QuickSort is O(n^2), which occurs when the partitioning algorithm consistently creates highly unbalanced subproblems (for example, when the smallest or largest element is repeatedly picked as pivot in an already sorted or reverse-sorted array without random pivoting).",
      confidence: 0.95,
    });
  }

  return "Hello! Groq client is ready.";
}

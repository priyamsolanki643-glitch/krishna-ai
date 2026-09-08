import { callGeminiFlash } from "../lib/gemini.js";
import { loadEpisodes, saveEpisode } from "../memory/episodic.js";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ─────────────────────────────────────────────────────────────────
// CONCEPT 2: Cognitive Budget Self-Play
// Background process where agents challenge each other with
// synthetic scenarios, learn from outcomes, and improve over time.
// No human data needed — pure synthetic self-improvement.
// ─────────────────────────────────────────────────────────────────

const MEMORY_DIR = join(process.cwd(), ".council-memory");
const LEARNED_STRATEGIES_FILE = join(MEMORY_DIR, "learned-strategies.json");

export interface SyntheticScenario {
  id: string;
  domain: string;
  challenge: string;
  difficulty: "easy" | "medium" | "hard";
  generatedAt: number;
}

export interface SelfPlayResult {
  scenario: SyntheticScenario;
  proposedSolution: string;
  critique: string;
  finalScore: number;       // 0-1
  learnedStrategy?: string; // If score > 0.8, save this as a learned strategy
}

export interface LearnedStrategy {
  id: string;
  domain: string;
  strategy: string;
  averageScore: number;
  usageCount: number;
  learnedAt: number;
}

// ── Step 1: Proposer — Generates a synthetic challenge ───────────
async function runProposer(domain: string, difficulty: "easy" | "medium" | "hard"): Promise<SyntheticScenario> {
  const difficultyGuide = {
    easy: "straightforward, single-step",
    medium: "requires 2-3 reasoning steps, has a non-obvious twist",
    hard: "multi-step, has a deliberate trap or common misconception embedded",
  };

  const raw = await callGeminiFlash({
    temperature: 0.9,
    systemPrompt: `You are a challenge designer. Generate ONE ${difficulty} reasoning challenge in the domain of "${domain}". 
The challenge should be ${difficultyGuide[difficulty]}.
Output ONLY JSON: {"challenge": "the scenario text here"}`,
    userPrompt: `Domain: ${domain}. Difficulty: ${difficulty}. Create a challenge.`,
    maxTokens: 200,
  });

  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  const challenge = jsonMatch ? JSON.parse(jsonMatch[0]).challenge : raw.slice(0, 300);

  return {
    id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    domain,
    challenge,
    difficulty,
    generatedAt: Date.now(),
  };
}

// ── Step 2: Solver — Attempts to solve the challenge ─────────────
async function runSolver(scenario: SyntheticScenario): Promise<string> {
  return await callGeminiFlash({
    temperature: 0.2,
    systemPrompt: `You are a precise solver. Solve the challenge step-by-step. Be concise.`,
    userPrompt: scenario.challenge,
    maxTokens: 400,
  });
}

// ── Step 3: Critic — Judges the solution quality ─────────────────
async function runCritic(scenario: SyntheticScenario, solution: string): Promise<{ score: number; critique: string; strategy?: string }> {
  const raw = await callGeminiFlash({
    temperature: 0.1,
    systemPrompt: `You are a strict evaluator. Evaluate this solution to the challenge.
Output ONLY JSON:
{
  "score": 0.85,
  "critique": "one sentence on what worked and what failed",
  "strategy": "one sentence generalizable lesson from this solution (only if score > 0.8)"
}
Score 0.0 = completely wrong, 1.0 = perfect.`,
    userPrompt: `Challenge: ${scenario.challenge}\n\nSolution: ${solution}`,
    maxTokens: 200,
  });

  try {
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.max(0, Math.min(1, parseFloat(parsed.score) || 0.5)),
      critique: parsed.critique || "No critique available",
      strategy: parsed.score > 0.8 ? parsed.strategy : undefined,
    };
  } catch {
    return { score: 0.5, critique: "Evaluation parsing failed" };
  }
}

// ── Load/Save Learned Strategies ─────────────────────────────────
async function loadStrategies(): Promise<LearnedStrategy[]> {
  try {
    if (!existsSync(LEARNED_STRATEGIES_FILE)) return [];
    return JSON.parse(await readFile(LEARNED_STRATEGIES_FILE, "utf-8"));
  } catch { return []; }
}

async function saveStrategy(strategy: Omit<LearnedStrategy, "id" | "usageCount">): Promise<void> {
  const strategies = await loadStrategies();
  const existing = strategies.find(s => s.domain === strategy.domain && s.strategy === strategy.strategy);
  if (existing) {
    existing.averageScore = (existing.averageScore + strategy.averageScore) / 2;
    existing.usageCount++;
  } else {
    strategies.push({
      id: `ls-${Date.now()}`,
      usageCount: 1,
      ...strategy,
    });
  }
  if (!existsSync(MEMORY_DIR)) await mkdir(MEMORY_DIR, { recursive: true });
  await writeFile(LEARNED_STRATEGIES_FILE, JSON.stringify(strategies.slice(-200), null, 2));
}

export async function getLearnedStrategiesForDomain(domain: string, limit = 3): Promise<string[]> {
  const strategies = await loadStrategies();
  return strategies
    .filter(s => s.domain === domain || domain.toLowerCase().includes(s.domain.toLowerCase()))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, limit)
    .map(s => s.strategy);
}

// ── Main Self-Play Runner ─────────────────────────────────────────
const DOMAINS = ["reasoning", "coding", "mathematics", "ethics", "systems design", "scientific method"];

export async function runSelfPlayCycle(rounds = 3): Promise<SelfPlayResult[]> {
  const results: SelfPlayResult[] = [];
  const episodes = await loadEpisodes();

  // Use past episodes to infer domains if available
  const recentDomains = episodes
    .slice(-10)
    .map(e => e.query.split(" ").slice(0, 3).join(" "));

  const activeDomains = recentDomains.length > 0
    ? [...DOMAINS, ...recentDomains.slice(0, 3)]
    : DOMAINS;

  for (let i = 0; i < rounds; i++) {
    const domain = activeDomains[Math.floor(Math.random() * activeDomains.length)];
    const difficulty = (["easy", "medium", "hard"] as const)[Math.floor(Math.random() * 3)];

    try {
      // Propose → Solve → Critique
      const scenario = await runProposer(domain, difficulty);
      const solution = await runSolver(scenario);
      const evaluation = await runCritic(scenario, solution);

      const result: SelfPlayResult = {
        scenario,
        proposedSolution: solution,
        critique: evaluation.critique,
        finalScore: evaluation.score,
        learnedStrategy: evaluation.strategy,
      };

      results.push(result);

      // Save high-quality solutions as learned strategies
      if (evaluation.score > 0.8 && evaluation.strategy) {
        await saveStrategy({
          domain,
          strategy: evaluation.strategy,
          averageScore: evaluation.score,
          learnedAt: Date.now(),
        });
      }

      // Save as episodic memory for the system to learn from
      await saveEpisode({
        timestamp: Date.now(),
        query: `[SELF-PLAY] ${scenario.challenge.slice(0, 150)}`,
        summary: `Score: ${evaluation.score.toFixed(2)} | ${evaluation.critique}`,
        agents: ["proposer", "solver", "critic"],
        confidence: evaluation.score,
      });

      console.log(`[SelfPlay] Round ${i + 1}/${rounds} | Domain: ${domain} | Score: ${evaluation.score.toFixed(2)}`);
    } catch (err) {
      console.error(`[SelfPlay] Round ${i + 1} failed:`, err);
    }
  }

  return results;
}

// Schedule self-play to run in background every hour if memory is sufficient
let selfPlayInterval: ReturnType<typeof setInterval> | null = null;

export function startSelfPlayScheduler(intervalMs = 60 * 60 * 1000): void {
  if (selfPlayInterval) return;
  selfPlayInterval = setInterval(async () => {
    console.log("[SelfPlay] Starting scheduled self-play cycle...");
    const results = await runSelfPlayCycle(3).catch(console.error);
    if (results) {
      const avgScore = results.reduce((s, r) => s + r.finalScore, 0) / results.length;
      console.log(`[SelfPlay] Cycle complete | ${results.length} rounds | Avg score: ${avgScore.toFixed(2)}`);
    }
  }, intervalMs);
}

export function stopSelfPlayScheduler(): void {
  if (selfPlayInterval) {
    clearInterval(selfPlayInterval);
    selfPlayInterval = null;
  }
}

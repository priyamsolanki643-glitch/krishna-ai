import { callGeminiFlash } from "../lib/gemini.js";

// ─────────────────────────────────────────────────────────────────
// CONCEPT 1: Automated Design of Agentic Systems (ADAS)
// The Architect meta-agent analyzes each query at runtime and
// generates a custom DAG pipeline — no hardcoded flow.
// ─────────────────────────────────────────────────────────────────

export type AgentName = "skeptic" | "engineer" | "visionary" | "synthesizer";

export type QueryType =
  | "factual"        // Simple fact lookup → single agent
  | "technical"      // Code / engineering → engineer-heavy
  | "philosophical"  // Ethics / ideas → visionary + skeptic
  | "analytical"     // Compare / evaluate → full ensemble
  | "creative"       // Brainstorm / design → visionary-heavy
  | "adversarial";   // Debate / argument → skeptic + debate

export interface PipelineNode {
  agent: AgentName;
  required: boolean;          // false = skip gracefully if fails
  weight: number;             // 0.0-1.0 influence on synthesis
  temperature: number;
}

export interface PipelineDAG {
  queryType: QueryType;
  rationale: string;
  parallelAgents: AgentName[];    // run these in parallel
  sequentialAgents: AgentName[];  // run these after parallel
  debateEnabled: boolean;
  debateRounds: number;
  nodes: Record<AgentName, PipelineNode>;
  estimatedComplexity: "low" | "medium" | "high";
}

// Fallback DAG for when architect itself fails
const FALLBACK_DAG: PipelineDAG = {
  queryType: "analytical",
  rationale: "Fallback: full ensemble activated",
  parallelAgents: ["skeptic", "engineer", "visionary"],
  sequentialAgents: [],
  debateEnabled: true,
  debateRounds: 1,
  estimatedComplexity: "high",
  nodes: {
    skeptic:     { agent: "skeptic",     required: false, weight: 0.25, temperature: 0.1 },
    engineer:    { agent: "engineer",    required: true,  weight: 0.35, temperature: 0.2 },
    visionary:   { agent: "visionary",   required: false, weight: 0.2,  temperature: 0.9 },
    synthesizer: { agent: "synthesizer", required: true,  weight: 1.0,  temperature: 0.5 },
  },
};

const QUERY_TYPE_PRESETS: Record<QueryType, Partial<PipelineDAG>> = {
  factual: {
    parallelAgents: ["engineer"],
    sequentialAgents: [],
    debateEnabled: false,
    debateRounds: 0,
    estimatedComplexity: "low",
    nodes: {
      skeptic:     { agent: "skeptic",     required: false, weight: 0,    temperature: 0.1 },
      engineer:    { agent: "engineer",    required: true,  weight: 0.9,  temperature: 0.1 },
      visionary:   { agent: "visionary",   required: false, weight: 0,    temperature: 0.9 },
      synthesizer: { agent: "synthesizer", required: true,  weight: 1.0,  temperature: 0.3 },
    },
  },
  technical: {
    parallelAgents: ["engineer", "skeptic"],
    sequentialAgents: [],
    debateEnabled: true,
    debateRounds: 1,
    estimatedComplexity: "medium",
    nodes: {
      skeptic:     { agent: "skeptic",     required: true,  weight: 0.3,  temperature: 0.1 },
      engineer:    { agent: "engineer",    required: true,  weight: 0.6,  temperature: 0.2 },
      visionary:   { agent: "visionary",   required: false, weight: 0,    temperature: 0.9 },
      synthesizer: { agent: "synthesizer", required: true,  weight: 1.0,  temperature: 0.4 },
    },
  },
  philosophical: {
    parallelAgents: ["visionary", "skeptic"],
    sequentialAgents: [],
    debateEnabled: true,
    debateRounds: 2,
    estimatedComplexity: "high",
    nodes: {
      skeptic:     { agent: "skeptic",     required: true,  weight: 0.35, temperature: 0.1 },
      engineer:    { agent: "engineer",    required: false, weight: 0.1,  temperature: 0.2 },
      visionary:   { agent: "visionary",   required: true,  weight: 0.45, temperature: 0.9 },
      synthesizer: { agent: "synthesizer", required: true,  weight: 1.0,  temperature: 0.6 },
    },
  },
  analytical: {
    parallelAgents: ["skeptic", "engineer", "visionary"],
    sequentialAgents: [],
    debateEnabled: true,
    debateRounds: 1,
    estimatedComplexity: "high",
    nodes: {
      skeptic:     { agent: "skeptic",     required: true,  weight: 0.3,  temperature: 0.1 },
      engineer:    { agent: "engineer",    required: true,  weight: 0.35, temperature: 0.2 },
      visionary:   { agent: "visionary",   required: true,  weight: 0.25, temperature: 0.9 },
      synthesizer: { agent: "synthesizer", required: true,  weight: 1.0,  temperature: 0.5 },
    },
  },
  creative: {
    parallelAgents: ["visionary", "engineer"],
    sequentialAgents: [],
    debateEnabled: false,
    debateRounds: 0,
    estimatedComplexity: "medium",
    nodes: {
      skeptic:     { agent: "skeptic",     required: false, weight: 0,    temperature: 0.1 },
      engineer:    { agent: "engineer",    required: true,  weight: 0.2,  temperature: 0.3 },
      visionary:   { agent: "visionary",   required: true,  weight: 0.7,  temperature: 0.9 },
      synthesizer: { agent: "synthesizer", required: true,  weight: 1.0,  temperature: 0.7 },
    },
  },
  adversarial: {
    parallelAgents: ["skeptic", "visionary"],
    sequentialAgents: ["engineer"],
    debateEnabled: true,
    debateRounds: 2,
    estimatedComplexity: "high",
    nodes: {
      skeptic:     { agent: "skeptic",     required: true,  weight: 0.4,  temperature: 0.1 },
      engineer:    { agent: "engineer",    required: true,  weight: 0.2,  temperature: 0.2 },
      visionary:   { agent: "visionary",   required: true,  weight: 0.3,  temperature: 0.9 },
      synthesizer: { agent: "synthesizer", required: true,  weight: 1.0,  temperature: 0.5 },
    },
  },
};

export async function runArchitect(query: string): Promise<PipelineDAG> {
  const systemPrompt = `You are The Architect — a meta-agent that designs optimal AI pipelines.
Analyze the query type and output ONLY valid JSON matching this schema:
{
  "queryType": "factual|technical|philosophical|analytical|creative|adversarial",
  "rationale": "one sentence explaining why"
}

Query types:
- factual: simple facts, definitions, what is X
- technical: code, engineering, how to build X, debug, architecture
- philosophical: ethics, meaning, opinion, what should, is it right
- analytical: compare, evaluate, best option, pros/cons, analyze
- creative: brainstorm, design, imagine, generate ideas
- adversarial: debate, argue, challenge, counter-argument`;

  try {
    const raw = await callGeminiFlash({
      temperature: 0.1,
      systemPrompt,
      userPrompt: query,
      maxTokens: 100,
    });

    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("No JSON in architect response");
    const parsed = JSON.parse(jsonMatch[0]);

    const queryType: QueryType = Object.keys(QUERY_TYPE_PRESETS).includes(parsed.queryType)
      ? (parsed.queryType as QueryType)
      : "analytical";

    const preset = QUERY_TYPE_PRESETS[queryType];
    return {
      queryType,
      rationale: parsed.rationale || `Optimized for ${queryType} queries`,
      ...preset,
    } as PipelineDAG;
  } catch {
    return { ...FALLBACK_DAG };
  }
}

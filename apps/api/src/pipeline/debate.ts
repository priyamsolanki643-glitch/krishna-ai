import { runSkeptic, type AgentResult } from "../agents/skeptic.js";
import { runEngineer } from "../agents/engineer.js";

export interface DebateResult {
  rounds: DebateRound[];
  finalOutputs: AgentResult[];
}

export interface DebateRound {
  round: number;
  skepticChallenge: string;
  engineerResponse: string;
}

export async function runDebateProtocol(
  query: string,
  initialOutputs: AgentResult[],
  maxRounds: number = 1
): Promise<DebateResult> {
  const rounds: DebateRound[] = [];
  let currentOutputs = [...initialOutputs];

  for (let round = 1; round <= maxRounds; round++) {
    const visionary = currentOutputs.find(o => o.agent === "Visionary");
    const engineer = currentOutputs.find(o => o.agent === "Engineer");
    if (!visionary || !engineer) break;

    // Skeptic challenges both Visionary and Engineer outputs
    const skepticChallenge = await runSkeptic(
      query,
      `Visionary proposed: ${visionary.output}\n\nEngineer proposed: ${engineer.output}`
    );

    // Engineer responds specifically to Skeptic's critique
    const engineerResponse = await runEngineer(
      `${query}\n\nSkeptic raised these specific concerns:\n${skepticChallenge.output}\n\nAddress each concern with technical precision.`
    );

    rounds.push({ round, skepticChallenge: skepticChallenge.output, engineerResponse: engineerResponse.output });

    // Update outputs with debate-refined versions
    currentOutputs = currentOutputs.map(o => {
      if (o.agent === "Engineer") return { ...engineerResponse, agent: "Engineer" };
      if (o.agent === "Skeptic") return { ...skepticChallenge, agent: "Skeptic" };
      return o;
    });
  }

  return { rounds, finalOutputs: currentOutputs };
}

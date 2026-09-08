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

  // Find the best "proposer" agent — prefer visionary, fall back to first non-skeptic agent
  const findProposer = (outputs: AgentResult[]) =>
    outputs.find(o => o.agent === "Visionary") ||
    outputs.find(o => o.agent !== "Skeptic") ||
    outputs[0];

  // Find the "engineer" responder — prefer Engineer, fall back to first available
  const findEngineer = (outputs: AgentResult[]) =>
    outputs.find(o => o.agent === "Engineer") ||
    outputs.find(o => o.agent !== "Skeptic") ||
    outputs[0];

  if (currentOutputs.length < 2) {
    return { rounds: [], finalOutputs: currentOutputs };
  }

  for (let round = 1; round <= maxRounds; round++) {
    const proposer = findProposer(currentOutputs);
    const responder = findEngineer(currentOutputs);

    if (!proposer || !responder) break;

    // Skeptic challenges the proposer's output
    const skepticChallenge = await runSkeptic(
      query,
      `${proposer.agent} proposed:\n${proposer.output}\n\n${responder.agent} proposed:\n${responder.output}`
    );

    // Responder addresses skeptic's critique
    const engineerResponse = await runEngineer(
      `${query}\n\nSkeptic raised these concerns:\n${skepticChallenge.output}\n\nAddress each concern with technical precision.`
    );

    rounds.push({
      round,
      skepticChallenge: skepticChallenge.output,
      engineerResponse: engineerResponse.output,
    });

    // Update outputs with debate-refined versions
    currentOutputs = currentOutputs.map(o => {
      if (o.agent === responder.agent) return { ...engineerResponse, agent: responder.agent };
      if (o.agent === "Skeptic") return { ...skepticChallenge, agent: "Skeptic" };
      return o;
    });
  }

  return { rounds, finalOutputs: currentOutputs };
}

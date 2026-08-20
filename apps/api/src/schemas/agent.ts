import { z } from "zod";

export const DraftOutputSchema = z.object({
  content: z.string().min(1, "Draft content cannot be empty").describe("The generated draft response"),
  confidence: z.number().min(0).max(1).describe("The agent's confidence in the generated draft"),
  needs_help: z.boolean().default(false).describe("Explicitly flag if the Lead is stuck and requests dynamic helper spawning"),
  help_query: z.string().optional().describe("If needs_help is true, specify the exact sub-problem or question for the Helper"),
  is_mock: z.boolean().default(false).describe("Flag indicating if the response is a mock fallback"),
});

export type DraftOutput = z.infer<typeof DraftOutputSchema>;

export const CritiqueOutputSchema = z.object({
  issue: z.string(),
  evidence: z.string(),
  confidence: z.number().min(0).max(1),
  suggested_fix: z.string(),
  verdict: z.enum(["approve", "reject"]),
  is_mock: z.boolean().default(false),
});

export type CritiqueOutput = z.infer<typeof CritiqueOutputSchema>;

export const SupervisorOutputSchema = z.object({
  domain: z.enum(["coding", "math", "research", "general"]),
  emotion: z.enum(["neutral", "frustrated", "excited", "confused"]),
  tone_instruction: z.string(),
  is_mock: z.boolean().default(false),
});

export type SupervisorOutput = z.infer<typeof SupervisorOutputSchema>;

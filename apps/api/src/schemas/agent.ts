import { z } from "zod";

export const DraftOutputSchema = z.object({
  content: z.string().min(1, "Draft content cannot be empty"),
  confidence: z.number().min(0).max(1),
});

export type DraftOutput = z.infer<typeof DraftOutputSchema>;

export const CritiqueOutputSchema = z.object({
  issue: z.string(),
  evidence: z.string(),
  confidence: z.number().min(0).max(1),
  suggested_fix: z.string(),
  verdict: z.enum(["approve", "reject"]),
});

export type CritiqueOutput = z.infer<typeof CritiqueOutputSchema>;

export const SupervisorOutputSchema = z.object({
  domain: z.enum(["coding", "math", "research", "general"]),
  emotion: z.enum(["neutral", "frustrated", "excited", "confused"]),
  tone_instruction: z.string(),
});

export type SupervisorOutput = z.infer<typeof SupervisorOutputSchema>;

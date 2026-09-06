import { loadEpisodes } from "./episodic.js";
import { callGeminiFlash } from "../lib/gemini.js";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";

const MEMORY_DIR = join(process.cwd(), ".council-memory");
const PROFILE_FILE = join(MEMORY_DIR, "user-profile.json");

export interface UserProfile {
  preferences: string[];
  keyFacts: string[];
  pastDecisions: string[];
  lastCompressed: number;
}

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    if (!existsSync(PROFILE_FILE)) return { preferences: [], keyFacts: [], pastDecisions: [], lastCompressed: 0 };
    return JSON.parse(await readFile(PROFILE_FILE, "utf-8"));
  } catch { return { preferences: [], keyFacts: [], pastDecisions: [], lastCompressed: 0 }; }
}

export async function getMemoryContext(): Promise<string> {
  const profile = await loadUserProfile();
  const parts: string[] = [];
  if (profile.keyFacts.length > 0) parts.push(`Known facts: ${profile.keyFacts.slice(-5).join("; ")}`);
  if (profile.preferences.length > 0) parts.push(`User prefers: ${profile.preferences.slice(-3).join("; ")}`);
  if (profile.pastDecisions.length > 0) parts.push(`Past decisions: ${profile.pastDecisions.slice(-3).join("; ")}`);
  return parts.join("\n");
}

export async function runSleepPhaseCompression(): Promise<void> {
  const episodes = await loadEpisodes();
  if (episodes.length < 5) return;

  const profile = await loadUserProfile();
  const newEpisodes = episodes.filter(ep => ep.timestamp > profile.lastCompressed);
  if (newEpisodes.length < 3) return;

  const episodeSummaries = newEpisodes.map(ep => `Q: ${ep.query}\nA: ${ep.summary}`).join("\n---\n");

  try {
    const raw = await callGeminiFlash({
      temperature: 0.1,
      systemPrompt: "You are a memory compression agent. Extract user facts, preferences, and decisions. Output strict JSON only.",
      userPrompt: `Compress these episodes:\n${episodeSummaries}\n\nOutput JSON:\n{"newPreferences":[],"newKeyFacts":[],"newDecisions":[]}`,
      maxTokens: 400,
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const parsed = JSON.parse(jsonMatch[0]);

    if (!existsSync(MEMORY_DIR)) await mkdir(MEMORY_DIR, { recursive: true });
    await writeFile(PROFILE_FILE, JSON.stringify({
      preferences: [...profile.preferences, ...(parsed.newPreferences || [])].slice(-20),
      keyFacts: [...profile.keyFacts, ...(parsed.newKeyFacts || [])].slice(-20),
      pastDecisions: [...profile.pastDecisions, ...(parsed.newDecisions || [])].slice(-20),
      lastCompressed: Date.now(),
    }, null, 2));

    console.log(`[Memory] Sleep-phase compression done: ${newEpisodes.length} episodes compressed.`);
  } catch (err) { console.error("[Memory] Compression error:", err); }
}

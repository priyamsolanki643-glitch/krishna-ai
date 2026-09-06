import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const MEMORY_DIR = join(process.cwd(), ".council-memory");
const EPISODIC_FILE = join(MEMORY_DIR, "episodic.json");

export interface Episode {
  id: string;
  timestamp: number;
  query: string;
  summary: string;
  agents: string[];
  confidence: number;
}

async function ensureDir() {
  if (!existsSync(MEMORY_DIR)) await mkdir(MEMORY_DIR, { recursive: true });
}

export async function loadEpisodes(): Promise<Episode[]> {
  try {
    await ensureDir();
    if (!existsSync(EPISODIC_FILE)) return [];
    return JSON.parse(await readFile(EPISODIC_FILE, "utf-8"));
  } catch { return []; }
}

export async function saveEpisode(ep: Omit<Episode, "id">): Promise<void> {
  const episodes = await loadEpisodes();
  const newEp: Episode = { ...ep, id: `ep-${Date.now()}-${Math.random().toString(36).slice(2,7)}` };
  const trimmed = [...episodes, newEp].slice(-100);
  await ensureDir();
  await writeFile(EPISODIC_FILE, JSON.stringify(trimmed, null, 2));
}

export async function searchEpisodes(query: string, limit = 3): Promise<Episode[]> {
  const episodes = await loadEpisodes();
  const words = query.toLowerCase().split(" ").filter(w => w.length > 3);
  if (words.length === 0) return [];
  const scored = episodes.map(ep => {
    const text = `${ep.query} ${ep.summary}`.toLowerCase();
    const score = words.filter(w => text.includes(w)).length;
    return { ep, score };
  });
  return scored.filter(s => s.score > 0).sort((a,b) => b.score - a.score).slice(0, limit).map(s => s.ep);
}

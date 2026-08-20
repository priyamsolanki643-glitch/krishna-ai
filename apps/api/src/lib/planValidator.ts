export function validateSpawnRequest(
  currentSpawnCount: number,
  maxSpawnsPerQuery: number = 1
): { allowed: boolean; reason?: string } {
  if (currentSpawnCount < maxSpawnsPerQuery) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Spawn budget exhausted. Maximum allowed spawns per query is ${maxSpawnsPerQuery}.`,
  };
}

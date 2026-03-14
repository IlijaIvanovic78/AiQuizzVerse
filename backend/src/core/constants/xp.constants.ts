/** XP required per level (level = floor(xp / XP_PER_LEVEL) + 1) */
export const XP_PER_LEVEL = 500;

/** Calculate user level from total XP */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

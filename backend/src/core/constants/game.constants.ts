/** Delay in ms before showing the next question after answer results */
export const RESULT_DISPLAY_MS = 3000;

/** Base score for a correct answer */
export const BASE_CORRECT_SCORE = 100;

/** Maximum bonus points for answering quickly */
export const SPEED_BONUS_MAX = 50;

/** XP/Coins rewards by match type */
export const MATCH_REWARDS = {
  SOLO: { xp: 50, coins: 20 },
  COOP: { xp: 75, coins: 40 },
  PVP_WINNER: { xp: 100, coins: 50 },
  PVP_LOSER: { xp: 25, coins: 10 },
} as const;

/**
 * Calculates points for a correct answer based on response speed.
 * Returns 0 for incorrect answers.
 */
export function calculateAnswerScore(isCorrect: boolean, timeMs: number, timeLimitMs: number): number {
  if (!isCorrect) return 0;
  const speedBonus = Math.max(0, Math.floor(((timeLimitMs - timeMs) / timeLimitMs) * SPEED_BONUS_MAX));
  return BASE_CORRECT_SCORE + speedBonus;
}

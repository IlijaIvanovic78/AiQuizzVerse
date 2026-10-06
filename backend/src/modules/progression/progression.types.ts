import { Difficulty, MatchMode, MatchOutcome } from '@prisma/client';

export interface Reward {
  xp: number;
  coins: number;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export interface MatchRewardInput {
  mode: MatchMode;
  difficulty: Difficulty;
  correctCount: number;
  outcome: MatchOutcome;
  /**
   * Abandoned matches pay only for correct answers, with no finish, win or streak bonus.
   * The streak itself still counts.
   */
  abandoned: boolean;
}

export interface PlayerReward {
  xpEarned: number;
  coinsEarned: number;
  leveledUp: boolean;
  levelsGained: number;
  coinCapReached: boolean;
  /** The streak after this match when the match moved it, otherwise null. */
  newStreak: number | null;
}

export interface StreakState {
  streak: number;
  lastPlayedOn: Date | null;
  streakFreezes: number;
}

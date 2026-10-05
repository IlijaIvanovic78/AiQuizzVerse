import { Difficulty, MatchMode } from '@prisma/client';

export type MatchOutcome = 'WIN' | 'LOSS' | 'DRAW' | 'DONE';

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
  /** Abandoned matches only pay for correct answers, without bonuses. */
  abandoned: boolean;
}

export interface PlayerReward {
  xpEarned: number;
  coinsEarned: number;
  leveledUp: boolean;
  coinCapReached: boolean;
}

export interface StreakState {
  streak: number;
  lastPlayedOn: Date | null;
  streakFreezes: number;
}

import { Difficulty } from '@prisma/client';
import { StageReward } from '../types/reward.types';

/** Difficulty progression across ranked journey stages (index = stage - 1) */
export const DIFFICULTY_PROGRESSION: Difficulty[] = [
  'EASY', 'EASY',
  'MEDIUM', 'MEDIUM',
  'HARD', 'HARD',
  'EXPERT', 'EXPERT',
];

/** Rewards for completing each ranked stage (index = stage - 1) */
export const STAGE_REWARDS: StageReward[] = [
  { type: 'COINS', amount: 30 },
  { type: 'HINT', amount: 2 },
  { type: 'COINS', amount: 60 },
  { type: 'EXTRA_TIME', amount: 2 },
  { type: 'COINS', amount: 90 },
  { type: 'FIFTY_FIFTY', amount: 2 },
  { type: 'COINS', amount: 120 },
  { type: 'COINS', amount: 200 },
];

/** Default reward when stage index exceeds STAGE_REWARDS length */
export const DEFAULT_STAGE_REWARD: StageReward = { type: 'COINS', amount: 50 };

/** Default number of stages in a ranked journey */
export const DEFAULT_TOTAL_STAGES = 8;

/** Number of questions per ranked stage */
export const RANKED_QUESTIONS_PER_STAGE = 5;

/** Time per question in ranked mode (seconds) */
export const RANKED_TIME_PER_QUESTION = 30;

import { Audience } from '@prisma/client';
import { PlannedStep, StepReward } from './learning-paths.types';

export const PATH_PLAN: PlannedStep[] = [
  { position: 1, goal: 'First steps', difficulty: 'EASY', questionCount: 5 },
  { position: 2, goal: 'Key facts', difficulty: 'EASY', questionCount: 5 },
  { position: 3, goal: 'How and why', difficulty: 'MEDIUM', questionCount: 5 },
  { position: 4, goal: 'Connecting ideas', difficulty: 'MEDIUM', questionCount: 6 },
  { position: 5, goal: 'Master challenge', difficulty: 'HARD', questionCount: 7 },
];

export const FIRST_STEP_POSITION = 1;
export const MAX_STARS_PER_STEP = 3;

export const STEP_TIME_PER_QUESTION: Record<Audience, number> = {
  KIDS: 45,
  TEENS: 30,
  ADULTS: 20,
};

export const STEP_REWARDS: Record<number, StepReward> = {
  1: { coins: 20, boost: 'HINT' },
  2: { coins: 25, boost: null },
  3: { coins: 30, boost: 'FIFTY_FIFTY' },
  4: { coins: 35, boost: 'EXTRA_TIME' },
  5: { coins: 60, boost: 'STREAK_FREEZE' },
};

export const NOT_YOUR_PATH_MESSAGE = 'This learning path belongs to someone else.';

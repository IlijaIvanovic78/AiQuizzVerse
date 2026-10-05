import { StepReward } from './learning-paths.types';

export const STEP_REWARDS: Record<number, StepReward> = {
  1: { coins: 20, boost: 'HINT' },
  2: { coins: 25, boost: null },
  3: { coins: 30, boost: 'FIFTY_FIFTY' },
  4: { coins: 35, boost: 'EXTRA_TIME' },
  5: { coins: 60, boost: 'STREAK_FREEZE' },
};

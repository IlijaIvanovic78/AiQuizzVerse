import { BoostType, PathStep } from '@prisma/client';

export interface StepReward {
  coins: number;
  boost: BoostType | null;
}

export interface PathResult {
  pathId: string;
  stepId: string;
  stars: number;
  cleared: boolean;
  nextStepId: string | null;
  reward: StepReward | null;
}

export type StepWithOwner = PathStep & { path: { ownerId: string } };

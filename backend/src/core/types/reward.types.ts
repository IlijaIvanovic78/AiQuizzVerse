import { BoostType } from '@prisma/client';

export interface StageReward {
  type: 'COINS' | BoostType;
  amount: number;
}

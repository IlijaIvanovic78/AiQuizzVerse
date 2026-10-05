import { BoostType } from '@prisma/client';

export const STARTER_BOOSTS: { type: BoostType; quantity: number }[] = [
  { type: 'HINT', quantity: 3 },
  { type: 'FIFTY_FIFTY', quantity: 2 },
];

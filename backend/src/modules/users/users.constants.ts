import { BoostType } from '@prisma/client';

export const STARTER_BOOSTS: { type: BoostType; quantity: number }[] = [
  { type: 'HINT', quantity: 3 },
  { type: 'FIFTY_FIFTY', quantity: 2 },
];

export const ACCOUNT_NOT_FOUND_MESSAGE = 'We could not find your account.';

import { BoostType } from '@prisma/client';

export const STARTER_BOOSTS: { type: BoostType; quantity: number }[] = [
  { type: 'HINT', quantity: 3 },
  { type: 'FIFTY_FIFTY', quantity: 2 },
];

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
export const USERNAME_RULE_MESSAGE = 'Your nickname needs 3-20 letters, numbers or underscores.';
export const USERNAME_TAKEN_MESSAGE = 'That nickname is taken. Please pick another one.';

export const ACCOUNT_NOT_FOUND_MESSAGE = 'We could not find your account.';

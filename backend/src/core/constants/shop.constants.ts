import { BoostType } from '@prisma/client';

/** Coin prices for each boost type */
export const BOOST_PRICES: Record<BoostType, number> = {
  HINT: 20,
  EXTRA_TIME: 15,
  FIFTY_FIFTY: 25,
  DOUBLE_POINTS: 30,
  SHIELD: 35,
  STREAK_FREEZE: 40,
};

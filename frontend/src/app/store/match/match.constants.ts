import { MatchBoostType } from '../../core/models/shop.model';

// Mirrors FREE_HINTS_PER_MATCH on the server; boost-used sends the real remaining count.
export const FREE_HINTS_PER_MATCH = 2;

export const STARTING_BOOST_USES: Record<MatchBoostType, number> = {
  HINT: FREE_HINTS_PER_MATCH,
  FIFTY_FIFTY: 0,
  EXTRA_TIME: 0,
  SECOND_CHANCE: 0,
};

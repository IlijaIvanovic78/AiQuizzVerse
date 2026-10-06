import { BoostType, ChestType } from '@prisma/client';
import { MATCH_BOOST_TYPES } from '../matches/matches.constants';
import { ChestDrop, MatchChestSource } from './chests.types';

/** One roll per chest; the weights of every table add up to 100. */
export const DROP_TABLES: Record<ChestType, ChestDrop[]> = {
  WOODEN: [
    { kind: 'COINS', weight: 70, minCoins: 20, maxCoins: 40 },
    { kind: 'BOOSTS', weight: 27, boostCount: 1, streakFreezes: 0 },
    { kind: 'ITEM', weight: 3, pool: 'BASIC' },
  ],
  SILVER: [
    { kind: 'COINS', weight: 50, minCoins: 50, maxCoins: 90 },
    { kind: 'BOOSTS', weight: 35, boostCount: 2, streakFreezes: 0 },
    { kind: 'ITEM', weight: 12, pool: 'BASIC' },
    { kind: 'ITEM', weight: 3, pool: 'CHEST_ONLY' },
  ],
  GOLDEN: [
    { kind: 'COINS', weight: 35, minCoins: 120, maxCoins: 200 },
    { kind: 'BOOSTS', weight: 35, boostCount: 3, streakFreezes: 1 },
    { kind: 'ITEM', weight: 20, pool: 'BASIC' },
    { kind: 'ITEM', weight: 10, pool: 'CHEST_ONLY' },
  ],
};

/** The match power-ups. A streak freeze is not one: only a golden chest adds one on top. */
export const CHEST_BOOSTS: BoostType[] = MATCH_BOOST_TYPES;

/** A basic item is a hero, pet or sabotage from the shop that costs at most this much. */
export const BASIC_ITEM_MAX_PRICE = 150;
/** Chest-only items have no shop price, so a duplicate one is worth this many coins. */
export const CHEST_ONLY_DUPLICATE_COINS = 150;

export const MATCH_CHESTS: Record<MatchChestSource, ChestType> = {
  DAILY_MATCH: 'WOODEN',
  VICTORY: 'WOODEN',
  LEVEL_UP: 'SILVER',
  STREAK: 'GOLDEN',
};
export const DAILY_CHEST_MIN_ACCURACY = 60;
export const MAX_VICTORY_CHESTS_PER_DAY = 2;
export const STREAK_CHEST_EVERY_DAYS = 7;

export const RECENT_CHESTS_LIMIT = 10;

export const CHEST_ALREADY_OPEN_MESSAGE = 'This chest is already open.';

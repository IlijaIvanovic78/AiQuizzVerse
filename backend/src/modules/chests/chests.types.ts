import { BoostType, ChestSource, ChestType, Item, MatchMode } from '@prisma/client';
import { ShopItem } from '../shop/shop.types';

export type ItemPoolName = 'BASIC' | 'CHEST_ONLY';

export type ItemPools = Record<ItemPoolName, Item[]>;

/** One row of a drop table: what a chest can give and how likely it is compared to the others. */
export type ChestDrop =
  | { kind: 'COINS'; weight: number; minCoins: number; maxCoins: number }
  | { kind: 'BOOSTS'; weight: number; boostCount: number; streakFreezes: number }
  | { kind: 'ITEM'; weight: number; pool: ItemPoolName };

export type MatchChestSource = Exclude<ChestSource, 'PATH_STEP'>;

export type ChestRewardKind = 'COINS' | 'BOOSTS' | 'ITEM';

export type BoostAmount = {
  type: BoostType;
  quantity: number;
};

/**
 * What an opened chest gave; a duplicate item comes with the coins it was turned into.
 * A type, not an interface, so Prisma accepts it as a Json value.
 */
export type ChestReward = {
  kind: ChestRewardKind;
  coins: number;
  boosts: BoostAmount[];
  item: ShopItem | null;
  duplicate: boolean;
};

/** A rolled reward whose item is still the database row. */
export interface RolledReward {
  kind: ChestRewardKind;
  coins: number;
  boosts: BoostAmount[];
  item: Item | null;
  duplicate: boolean;
}

export interface ChestView {
  id: string;
  type: ChestType;
  source: ChestSource;
  earnedAt: Date;
  openedAt: Date | null;
  reward: ChestReward | null;
}

export interface ChestList {
  unopened: ChestView[];
  recent: ChestView[];
}

export interface OpenedChest {
  chest: ChestView;
  reward: ChestReward;
  coins: number;
}

export interface DropOdds {
  label: string;
  percent: number;
}

export type ChestOdds = Record<ChestType, DropOdds[]>;

export interface EarnedChest {
  type: ChestType;
  source: ChestSource;
}

export interface NewChest extends EarnedChest {
  /** The match that earned the chest, so its result can show it. */
  matchId: string;
}

/** What a saved match tells the chests about one player. */
export interface MatchChestFacts {
  matchId: string;
  mode: MatchMode;
  finished: boolean;
  accuracy: number;
  isWinner: boolean;
  levelsGained: number;
  /** The streak after this match when the match moved it, otherwise null. */
  newStreak: number | null;
}

/** Chests with a daily limit that the player has already earned today. */
export interface ChestsEarnedToday {
  daily: number;
  victories: number;
}

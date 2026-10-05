import { BoostType, ShopItem } from './shop.model';

export type ChestType = 'WOODEN' | 'SILVER' | 'GOLDEN';

export type ChestSource = 'DAILY_MATCH' | 'VICTORY' | 'PATH_STEP' | 'LEVEL_UP' | 'STREAK';

export type ChestRewardKind = 'COINS' | 'BOOSTS' | 'ITEM';

export interface BoostAmount {
  type: BoostType;
  quantity: number;
}

// A duplicate item comes with the coins it was turned into, and item.owned is true either way.
export interface ChestReward {
  kind: ChestRewardKind;
  coins: number;
  boosts: BoostAmount[];
  item: ShopItem | null;
  duplicate: boolean;
}

export interface ChestView {
  id: string;
  type: ChestType;
  source: ChestSource;
  earnedAt: string;
  openedAt: string | null;
  reward: ChestReward | null;
}

// Both lists are newest first; recent holds the last opened chests.
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

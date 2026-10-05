export type ItemType = 'AVATAR' | 'PET';

export type BoostType = 'HINT' | 'FIFTY_FIFTY' | 'EXTRA_TIME' | 'SECOND_CHANCE' | 'STREAK_FREEZE';

export type MatchBoostType = Exclude<BoostType, 'STREAK_FREEZE'>;

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  minLevel: number;
  isStarter: boolean;
  // Never sold in the shop; it can only drop from a chest.
  isChestOnly: boolean;
  owned: boolean;
  equipped: boolean;
}

export interface ItemPurchase {
  coins: number;
  item: ShopItem;
}

export interface BoostOffer {
  type: BoostType;
  name: string;
  description: string;
  price: number | null;
  owned: number;
}

export interface BoostPurchase {
  coins: number;
  boost: BoostOffer;
}

export type ItemType = 'AVATAR' | 'PET';

export type BoostType = 'HINT' | 'FIFTY_FIFTY' | 'EXTRA_TIME' | 'STREAK_FREEZE';

export type MatchBoostType = Exclude<BoostType, 'STREAK_FREEZE'>;

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  minLevel: number;
  isStarter: boolean;
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

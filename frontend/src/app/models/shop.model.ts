export type ItemType = 'HAT' | 'ARMOR' | 'WEAPON' | 'SHIELD' | 'BADGE' | 'PET' | 'AVATAR';
export type BoostType = 'HINT' | 'EXTRA_TIME' | 'FIFTY_FIFTY' | 'DOUBLE_POINTS' | 'SHIELD' | 'STREAK_FREEZE';

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  imagePath: string;
  price: number;
  minLevel: number;
}

export interface UserItem {
  id: string;
  userId: string;
  itemId: string;
  isEquipped: boolean;
  item: ShopItem;
}

export interface UserBoost {
  id: string;
  userId: string;
  type: BoostType;
  quantity: number;
}

export interface BoostResult {
  type: BoostType;
  effect: { eliminatedIndices?: number[]; hint?: string } | null;
}

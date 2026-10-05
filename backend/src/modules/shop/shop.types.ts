import { BoostType, ItemType } from '@prisma/client';

/** A type, not an interface, so an opened chest can store the item it gave as a Json value. */
export type ShopItem = {
  id: string;
  name: string;
  /** What a sabotage does; empty for heroes and pets. */
  description: string;
  type: ItemType;
  price: number;
  minLevel: number;
  isStarter: boolean;
  /** Found only in chests: listed in the shop, but never sold. */
  isChestOnly: boolean;
  owned: boolean;
  /** Always false for sabotages: they are not worn, they are ready in every party match. */
  equipped: boolean;
};

export interface ItemPurchase {
  coins: number;
  item: ShopItem;
}

export interface BoostCatalogEntry {
  type: BoostType;
  name: string;
  description: string;
  /** null means the boost is never sold, only earned. */
  price: number | null;
}

export interface BoostOffer extends BoostCatalogEntry {
  owned: number;
}

export interface BoostPurchase {
  coins: number;
  boost: BoostOffer;
}

export interface ShopCustomer {
  coins: number;
  xp: number;
  avatarKey: string | null;
  petKey: string | null;
  ownedItemIds: Set<string>;
}

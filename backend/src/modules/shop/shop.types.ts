import { BoostType, ItemType } from '@prisma/client';

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

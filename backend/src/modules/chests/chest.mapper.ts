import { UserChest } from '@prisma/client';
import { toShopItem } from '../shop/shop-item.mapper';
import { ShopCustomer } from '../shop/shop.types';
import { ChestReward, ChestView, RolledReward } from './chests.types';

export function toChestView(chest: UserChest): ChestView {
  return {
    id: chest.id,
    type: chest.type,
    source: chest.source,
    earnedAt: chest.earnedAt,
    openedAt: chest.openedAt,
    reward: chest.reward as ChestReward | null,
  };
}

/** The item is shown as the shop shows it after the chest is opened: owned either way. */
export function toChestReward(rolled: RolledReward, customer: ShopCustomer): ChestReward {
  const item = rolled.item
    ? toShopItem(rolled.item, { ...customer, ownedItemIds: new Set([rolled.item.id]) })
    : null;
  return { ...rolled, item };
}

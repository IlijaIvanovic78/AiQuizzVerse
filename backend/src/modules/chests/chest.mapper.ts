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

export function toChestReward(rolled: RolledReward, player: ShopCustomer): ChestReward {
  // The player owns the item now, whether it is new or a duplicate.
  const item = rolled.item ? { ...toShopItem(rolled.item, player), owned: true } : null;
  return { ...rolled, item };
}

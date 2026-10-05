import { Item } from '@prisma/client';
import { ShopCustomer, ShopItem } from './shop.types';

export function toShopItem(item: Item, customer: ShopCustomer): ShopItem {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    price: item.price,
    minLevel: item.minLevel,
    isStarter: item.isStarter,
    owned: customer.ownedItemIds.has(item.id),
    equipped: item.id === customer.avatarKey || item.id === customer.petKey,
  };
}

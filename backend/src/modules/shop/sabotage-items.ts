import { Prisma } from '@prisma/client';
import { FREE_SABOTAGES, SABOTAGE_TYPES } from '../matches/matches.constants';
import { SabotageType } from '../matches/matches.types';

/** Sabotage items are named after their sabotage: FOG is sold as `sabotage-fog`. */
const SABOTAGE_ITEM_PREFIX = 'sabotage-';

/** The sabotage items a user owns, loaded together with the user as `items`. */
export const SABOTAGE_ITEMS_SELECT = {
  where: { item: { type: 'SABOTAGE' } },
  select: { itemId: true },
} satisfies Prisma.User$itemsArgs;

export function sabotageItemId(type: SabotageType): string {
  return SABOTAGE_ITEM_PREFIX + type.toLowerCase();
}

/** The free sabotages plus the ones bought in the shop or found in a chest. */
export function ownedSabotages(items: { itemId: string }[]): SabotageType[] {
  const ownedItemIds = items.map((item) => item.itemId);
  return SABOTAGE_TYPES.filter(
    (type) => FREE_SABOTAGES.includes(type) || ownedItemIds.includes(sabotageItemId(type)),
  );
}

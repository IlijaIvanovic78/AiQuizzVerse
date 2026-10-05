import { AttackType, SabotageType } from '../core/models/match.model';
import { ShopItem } from '../core/models/shop.model';

// The attacks in the order the party sabotage bar shows them.
export const ATTACKS: AttackType[] = ['INK', 'FREEZE', 'SCRAMBLE', 'FOG', 'QUAKE', 'MIRROR'];
// The shield is the one sabotage that protects instead of attacking.
export const SABOTAGE_TYPES: SabotageType[] = [...ATTACKS, 'SHIELD'];

const SABOTAGE_ITEM_PREFIX = 'sabotage-';

// A sabotage item id names its type, like 'sabotage-fog' for FOG. Heroes and pets give null.
export function sabotageOfItem(item: ShopItem): SabotageType | null {
  if (item.type !== 'SABOTAGE') {
    return null;
  }
  const typeName = item.id.slice(SABOTAGE_ITEM_PREFIX.length).toUpperCase();
  return SABOTAGE_TYPES.find((type) => type === typeName) ?? null;
}

// A bought or found sabotage joins the ones the player owns; any other item changes nothing.
export function withUnlockedSabotage(owned: SabotageType[], item: ShopItem): SabotageType[] {
  const type = sabotageOfItem(item);
  return type && !owned.includes(type) ? [...owned, type] : owned;
}

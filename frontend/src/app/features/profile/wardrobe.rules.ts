import { ItemType, ShopItem } from '../../core/models/shop.model';

// Only the heroes or pets the player owns, in the shop's order, so a card keeps its place when
// it is equipped.
export function wardrobeItems(items: ShopItem[], type: ItemType): ShopItem[] {
  return items.filter((item) => item.owned && item.type === type);
}

// The line under the wardrobe title. Screen readers read it again after every change.
export function wearingLine(items: ShopItem[]): string {
  const hero = items.find((item) => item.type === 'AVATAR' && item.equipped);
  const pet = items.find((item) => item.type === 'PET' && item.equipped);
  if (!hero) {
    return '';
  }
  if (!pet) {
    return `You play as ${hero.name}, without a pet.`;
  }
  return `You play as ${hero.name}, with ${pet.name} at your side.`;
}

import { ShopItem } from '../../core/models/shop.model';

type ItemState = 'equipped' | 'owned' | 'level-locked' | 'too-expensive' | 'for-sale';

export function itemState(item: ShopItem, level: number, coins: number): ItemState {
  if (item.equipped) {
    return 'equipped';
  }
  if (item.owned) {
    return 'owned';
  }
  if (level < item.minLevel) {
    return 'level-locked';
  }
  return coins < item.price ? 'too-expensive' : 'for-sale';
}

// Starter heroes are only picked on the welcome screen, so the shop hides the ones the player
// did not pick instead of showing heroes that can never be bought.
export function isShownInShop(item: ShopItem): boolean {
  return !item.isStarter || item.owned;
}

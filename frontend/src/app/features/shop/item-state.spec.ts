import { ShopItem } from '../../core/models/shop.model';
import { isShownInShop, itemState } from './item-state';

function item(changes: Partial<ShopItem>): ShopItem {
  return {
    id: 'mini-king-man',
    name: 'King',
    type: 'AVATAR',
    price: 250,
    minLevel: 5,
    isStarter: false,
    owned: false,
    equipped: false,
    ...changes,
  };
}

describe('itemState', () => {
  it('shows equipped before anything else', () => {
    expect(itemState(item({ owned: true, equipped: true }), 1, 0)).toBe('equipped');
  });

  it('lets the player equip an owned item even below its level', () => {
    expect(itemState(item({ owned: true }), 1, 0)).toBe('owned');
  });

  it('locks items above the player level', () => {
    expect(itemState(item({}), 4, 1000)).toBe('level-locked');
  });

  it('asks for more coins when the price is too high', () => {
    expect(itemState(item({}), 5, 249)).toBe('too-expensive');
    expect(itemState(item({}), 5, 250)).toBe('for-sale');
  });
});

describe('isShownInShop', () => {
  it('hides starter heroes the player did not pick', () => {
    expect(isShownInShop(item({ isStarter: true, price: 0 }))).toBe(false);
    expect(isShownInShop(item({ isStarter: true, price: 0, owned: true }))).toBe(true);
    expect(isShownInShop(item({}))).toBe(true);
  });
});

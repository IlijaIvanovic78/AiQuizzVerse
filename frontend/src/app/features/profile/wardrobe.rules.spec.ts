import { ShopItem } from '../../core/models/shop.model';
import { wardrobeItems, wearingLine } from './wardrobe.rules';

function item(id: string, changes: Partial<ShopItem>): ShopItem {
  return {
    id,
    name: id,
    type: 'AVATAR',
    description: '',
    price: 100,
    minLevel: 1,
    isStarter: false,
    isChestOnly: false,
    owned: true,
    equipped: false,
    ...changes,
  };
}

const mage = item('Mage', { equipped: true });
const knight = item('Knight', {});
const king = item('King', { owned: false });
const fox = item('Fox', { type: 'PET' });
const bunny = item('Bunny', { type: 'PET', owned: false });
const fog = item('Fog', { type: 'SABOTAGE' });
const shopItems = [mage, knight, king, fox, bunny, fog];

describe('wardrobeItems', () => {
  it('shows only the owned heroes, in the shop order', () => {
    expect(wardrobeItems(shopItems, 'AVATAR')).toEqual([mage, knight]);
  });

  it('shows only the owned pets', () => {
    expect(wardrobeItems(shopItems, 'PET')).toEqual([fox]);
  });

  it('is empty when the player owns none of that kind', () => {
    expect(wardrobeItems([mage, bunny], 'PET')).toEqual([]);
  });
});

describe('wearingLine', () => {
  it('names the hero and the pet the player wears', () => {
    const wornFox = { ...fox, equipped: true };

    expect(wearingLine([mage, knight, wornFox])).toBe('You play as Mage, with Fox at your side.');
  });

  it('says when no pet follows the hero', () => {
    expect(wearingLine([mage, knight, fox])).toBe('You play as Mage, without a pet.');
  });

  it('stays empty until the items are loaded', () => {
    expect(wearingLine([])).toBe('');
  });
});

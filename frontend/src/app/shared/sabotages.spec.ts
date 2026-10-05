import { ShopItem } from '../core/models/shop.model';
import { sabotageOfItem, withUnlockedSabotage } from './sabotages';

function item(changes: Partial<ShopItem>): ShopItem {
  return {
    id: 'sabotage-fog',
    name: 'Fog',
    type: 'SABOTAGE',
    description: "Blur a rival's question for 4 seconds.",
    price: 100,
    minLevel: 3,
    isStarter: false,
    isChestOnly: false,
    owned: true,
    equipped: false,
    ...changes,
  };
}

describe('sabotageOfItem', () => {
  it('reads the sabotage type from the item id', () => {
    expect(sabotageOfItem(item({}))).toBe('FOG');
    expect(sabotageOfItem(item({ id: 'sabotage-shield' }))).toBe('SHIELD');
  });

  it('gives null for heroes, pets and unknown ids', () => {
    expect(sabotageOfItem(item({ id: 'hero-fire-mage', type: 'AVATAR' }))).toBeNull();
    expect(sabotageOfItem(item({ id: 'pet-slime-green', type: 'PET' }))).toBeNull();
    expect(sabotageOfItem(item({ id: 'sabotage-thunder' }))).toBeNull();
  });
});

describe('withUnlockedSabotage', () => {
  it('adds a new sabotage to the ones the player owns', () => {
    expect(withUnlockedSabotage(['INK'], item({}))).toEqual(['INK', 'FOG']);
  });

  it('keeps the list as it is for a sabotage the player already has', () => {
    expect(withUnlockedSabotage(['INK', 'FOG'], item({}))).toEqual(['INK', 'FOG']);
  });

  it('keeps the list as it is for a hero or a pet', () => {
    const hero = item({ id: 'hero-fire-mage', type: 'AVATAR' });

    expect(withUnlockedSabotage(['INK'], hero)).toEqual(['INK']);
  });
});

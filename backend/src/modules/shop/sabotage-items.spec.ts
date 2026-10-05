import { ownedSabotages, sabotageItemId } from './sabotage-items';

describe('sabotage items', () => {
  it('are named after their sabotage', () => {
    expect(sabotageItemId('FOG')).toBe('sabotage-fog');
    expect(sabotageItemId('SHIELD')).toBe('sabotage-shield');
  });

  it('give everyone ink for free', () => {
    expect(ownedSabotages([])).toEqual(['INK']);
  });

  it('add the bought sabotages and ignore heroes and pets', () => {
    const items = [
      { itemId: 'sabotage-shield' },
      { itemId: 'pet-fox' },
      { itemId: 'sabotage-fog' },
    ];
    expect(ownedSabotages(items)).toEqual(['INK', 'FOG', 'SHIELD']);
  });
});

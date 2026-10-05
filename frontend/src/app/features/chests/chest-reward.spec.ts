import { ChestReward } from '../../core/models/chest.model';
import { ShopItem } from '../../core/models/shop.model';
import { rewardSummary } from './chest-reward';

const goldenKing: ShopItem = {
  id: 'hero-golden-king',
  name: 'Golden King',
  type: 'AVATAR',
  price: 0,
  minLevel: 1,
  isStarter: false,
  isChestOnly: true,
  owned: true,
  equipped: false,
};

function reward(changes: Partial<ChestReward>): ChestReward {
  return { kind: 'COINS', coins: 0, boosts: [], item: null, duplicate: false, ...changes };
}

describe('rewardSummary', () => {
  it('names the coins', () => {
    expect(rewardSummary(reward({ coins: 35 }))).toBe('35 coins');
  });

  it('lists every power-up with how many there are', () => {
    const boosts = reward({
      kind: 'BOOSTS',
      boosts: [
        { type: 'HINT', quantity: 2 },
        { type: 'STREAK_FREEZE', quantity: 1 },
      ],
    });

    expect(rewardSummary(boosts)).toBe('Hint x2, Streak freeze x1');
  });

  it('says when a hero the player already had was turned into coins', () => {
    expect(rewardSummary(reward({ kind: 'ITEM', item: goldenKing }))).toBe('Golden King');
    expect(
      rewardSummary(reward({ kind: 'ITEM', item: goldenKing, duplicate: true, coins: 150 })),
    ).toBe('Golden King, turned into 150 coins');
  });
});

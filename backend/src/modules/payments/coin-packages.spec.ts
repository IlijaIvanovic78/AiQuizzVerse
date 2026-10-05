import { COIN_PACKAGES, findCoinPackage, totalCoins } from './coin-packages';

describe('coin packages', () => {
  it('adds the bonus coins to the pack', () => {
    expect(COIN_PACKAGES.map(totalCoins)).toEqual([150, 330, 690]);
  });

  it('finds a pack by id', () => {
    expect(findCoinPackage('chest')?.priceCents).toBe(199);
    expect(findCoinPackage('piggy-bank')).toBeUndefined();
  });
});

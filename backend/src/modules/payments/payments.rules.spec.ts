import { COIN_PACKAGES, findCoinPackage, totalCoins } from './coin-packages';
import { exceedsMonthlyLimit, spendingWindowStart } from './payments.rules';

describe('monthly spending limit', () => {
  it('allows a pack while the total stays within 10 euros', () => {
    expect(exceedsMonthlyLimit(0, 399)).toBe(false);
    expect(exceedsMonthlyLimit(601, 399)).toBe(false);
  });

  it('refuses a pack that would go over 10 euros', () => {
    expect(exceedsMonthlyLimit(798, 399)).toBe(true);
    expect(exceedsMonthlyLimit(902, 99)).toBe(true);
  });

  it('counts the last 30 days', () => {
    expect(spendingWindowStart(new Date('2026-10-05T12:00:00Z'))).toEqual(
      new Date('2026-09-05T12:00:00Z'),
    );
  });
});

describe('coin packages', () => {
  it('adds the bonus coins to the pack', () => {
    expect(COIN_PACKAGES.map(totalCoins)).toEqual([150, 330, 690]);
  });

  it('finds a pack by id', () => {
    expect(findCoinPackage('chest')?.priceCents).toBe(199);
    expect(findCoinPackage('piggy-bank')).toBeUndefined();
  });
});

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

import { addUtcDays } from '../../common/utils/dates';
import { MONTHLY_LIMIT_CENTS, SPENDING_WINDOW_DAYS } from './payments.constants';

export function spendingWindowStart(now: Date): Date {
  return addUtcDays(now, -SPENDING_WINDOW_DAYS);
}

export function exceedsMonthlyLimit(spentCents: number, priceCents: number): boolean {
  return spentCents + priceCents > MONTHLY_LIMIT_CENTS;
}

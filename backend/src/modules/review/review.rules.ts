import { addUtcDays } from '../../common/utils/dates';
import { REVIEW_INTERVALS_DAYS } from './review.constants';

export function nextReviewDate(correctStreak: number, today: Date): Date {
  return addUtcDays(today, REVIEW_INTERVALS_DAYS[correctStreak]);
}

export function isMastered(correctStreak: number): boolean {
  return correctStreak >= REVIEW_INTERVALS_DAYS.length;
}

export function isDue(dueOn: Date, today: Date): boolean {
  return dueOn.getTime() <= today.getTime();
}

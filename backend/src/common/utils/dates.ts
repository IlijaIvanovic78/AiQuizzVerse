const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const MONDAY = 1;

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function utcToday(): Date {
  return startOfUtcDay(new Date());
}

export function addUtcDays(day: Date, days: number): Date {
  return new Date(day.getTime() + days * MS_PER_DAY);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);
}

export function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const daysSinceMonday = (day.getUTCDay() - MONDAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  return addUtcDays(day, -daysSinceMonday);
}

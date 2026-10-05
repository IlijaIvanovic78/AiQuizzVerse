import { addUtcDays, daysBetween, startOfUtcDay, startOfUtcWeek } from './dates';

describe('dates', () => {
  it('cuts a date down to midnight UTC', () => {
    expect(startOfUtcDay(new Date('2026-03-14T22:45:10Z'))).toEqual(
      new Date('2026-03-14T00:00:00Z'),
    );
  });

  it('adds whole days', () => {
    expect(addUtcDays(new Date('2026-02-27T00:00:00Z'), 3)).toEqual(
      new Date('2026-03-02T00:00:00Z'),
    );
  });

  it('counts calendar days, not hours', () => {
    expect(daysBetween(new Date('2026-05-01T23:59:00Z'), new Date('2026-05-02T00:01:00Z'))).toBe(1);
    expect(daysBetween(new Date('2026-05-01T08:00:00Z'), new Date('2026-05-01T20:00:00Z'))).toBe(0);
  });

  it('finds the Monday of the week', () => {
    expect(startOfUtcWeek(new Date('2026-10-04T12:00:00Z'))).toEqual(
      new Date('2026-09-28T00:00:00Z'),
    );
    expect(startOfUtcWeek(new Date('2026-10-05T09:00:00Z'))).toEqual(
      new Date('2026-10-05T00:00:00Z'),
    );
  });
});

import { isDue, isMastered, nextReviewDate } from './review.rules';

describe('review rules', () => {
  const today = new Date('2026-10-05T00:00:00Z');

  it('brings a missed question back tomorrow', () => {
    expect(nextReviewDate(0, today)).toEqual(new Date('2026-10-06T00:00:00Z'));
  });

  it('waits 3 and then 7 days after correct answers in a row', () => {
    expect(nextReviewDate(1, today)).toEqual(new Date('2026-10-08T00:00:00Z'));
    expect(nextReviewDate(2, today)).toEqual(new Date('2026-10-12T00:00:00Z'));
  });

  it('marks a question as mastered after 3 correct answers in a row', () => {
    expect(isMastered(2)).toBe(false);
    expect(isMastered(3)).toBe(true);
  });

  it('is due on the due day and after it', () => {
    expect(isDue(new Date('2026-10-04T00:00:00Z'), today)).toBe(true);
    expect(isDue(today, today)).toBe(true);
    expect(isDue(new Date('2026-10-06T00:00:00Z'), today)).toBe(false);
  });
});

import { starsForAccuracy } from './stars';

describe('starsForAccuracy', () => {
  it('gives a star at 60%, two at 80% and three only for a perfect run', () => {
    expect(starsForAccuracy(59)).toBe(0);
    expect(starsForAccuracy(60)).toBe(1);
    expect(starsForAccuracy(80)).toBe(2);
    expect(starsForAccuracy(99)).toBe(2);
    expect(starsForAccuracy(100)).toBe(3);
  });
});

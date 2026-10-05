import { createGateQuestion, isGateAnswerCorrect } from './gate-question';

describe('grown-up gate question', () => {
  it('uses the smallest numbers when random returns 0', () => {
    expect(createGateQuestion(() => 0)).toEqual({ left: 12, right: 3, answer: 36 });
  });

  it('never goes past a two-digit times a one-digit number', () => {
    expect(createGateQuestion(() => 0.9999)).toEqual({ left: 99, right: 9, answer: 891 });
  });

  it('accepts the right answer with spaces around it', () => {
    const question = { left: 47, right: 6, answer: 282 };

    expect(isGateAnswerCorrect(question, ' 282 ')).toBe(true);
    expect(isGateAnswerCorrect(question, '281')).toBe(false);
    expect(isGateAnswerCorrect(question, '')).toBe(false);
  });
});

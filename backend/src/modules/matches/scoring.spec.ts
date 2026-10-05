import { answerPoints, duelWinnerIds, findWinnerIds, playerOutcome, teamWon } from './scoring';

const TIME_LIMIT_MS = 30_000;

describe('answer points', () => {
  it('gives nothing for a wrong answer', () => {
    expect(answerPoints(false, TIME_LIMIT_MS, TIME_LIMIT_MS)).toBe(0);
  });

  it('adds up to 50 speed points to the 100 base points', () => {
    expect(answerPoints(true, TIME_LIMIT_MS, TIME_LIMIT_MS)).toBe(150);
    expect(answerPoints(true, TIME_LIMIT_MS / 2, TIME_LIMIT_MS)).toBe(125);
    expect(answerPoints(true, 0, TIME_LIMIT_MS)).toBe(100);
  });

  it('caps the speed bonus when extra time made the round longer', () => {
    expect(answerPoints(true, TIME_LIMIT_MS * 2, TIME_LIMIT_MS)).toBe(150);
  });

  it('never goes below the base points for a late answer', () => {
    expect(answerPoints(true, -500, TIME_LIMIT_MS)).toBe(100);
  });
});

describe('duel winner', () => {
  it('picks the player with more correct answers even with a lower score', () => {
    const winners = duelWinnerIds([
      { userId: 'ana', correctCount: 4, score: 400 },
      { userId: 'marko', correctCount: 3, score: 450 },
    ]);
    expect(winners).toEqual(['ana']);
  });

  it('uses the score when both answered the same number correctly', () => {
    const winners = duelWinnerIds([
      { userId: 'ana', correctCount: 3, score: 380 },
      { userId: 'marko', correctCount: 3, score: 410 },
    ]);
    expect(winners).toEqual(['marko']);
  });

  it('is a draw when correct answers and score are equal', () => {
    const winners = duelWinnerIds([
      { userId: 'ana', correctCount: 3, score: 400 },
      { userId: 'marko', correctCount: 3, score: 400 },
    ]);
    expect(winners).toEqual([]);
  });
});

describe('team result', () => {
  const players = (first: number, second: number) => [
    { userId: 'ana', correctCount: first, score: 0 },
    { userId: 'marko', correctCount: second, score: 0 },
  ];

  it('wins together at 60% team accuracy', () => {
    expect(teamWon(players(3, 3), 5)).toBe(true);
    expect(teamWon(players(4, 2), 5)).toBe(true);
  });

  it('loses together below 60%', () => {
    expect(teamWon(players(3, 2), 5)).toBe(false);
  });

  it('makes both players winners when the team wins', () => {
    expect(findWinnerIds('TEAM', players(5, 5), 5)).toEqual(['ana', 'marko']);
    expect(findWinnerIds('TEAM', players(1, 1), 5)).toEqual([]);
  });

  it('never has winners in solo play', () => {
    expect(findWinnerIds('SOLO', [{ userId: 'ana', correctCount: 5, score: 750 }], 5)).toEqual([]);
  });
});

describe('player outcome', () => {
  it('is DONE for solo play', () => {
    expect(playerOutcome('SOLO', false, false)).toBe('DONE');
  });

  it('tells a duel win, loss and draw apart', () => {
    expect(playerOutcome('DUEL', true, true)).toBe('WIN');
    expect(playerOutcome('DUEL', false, true)).toBe('LOSS');
    expect(playerOutcome('DUEL', false, false)).toBe('DRAW');
  });

  it('has no draw for teams', () => {
    expect(playerOutcome('TEAM', true, true)).toBe('WIN');
    expect(playerOutcome('TEAM', false, false)).toBe('LOSS');
  });
});

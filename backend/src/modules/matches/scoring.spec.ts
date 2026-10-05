import {
  answerPoints,
  findWinnerIds,
  partyWinnerIds,
  playerOutcome,
  secondTryPoints,
  teamWon,
} from './scoring';

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

describe('second try points', () => {
  it('gives half the base points and no speed bonus for a correct second try', () => {
    expect(secondTryPoints(true)).toBe(50);
  });

  it('gives nothing when the second try is wrong too', () => {
    expect(secondTryPoints(false)).toBe(0);
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

describe('party winner', () => {
  it('is the player with the highest score', () => {
    const winners = partyWinnerIds([
      { userId: 'ana', correctCount: 2, score: 275 },
      { userId: 'marko', correctCount: 3, score: 260 },
      { userId: 'iva', correctCount: 0, score: 0 },
    ]);
    expect(winners).toEqual(['ana']);
  });

  it('is nobody when the top score is shared', () => {
    const players = [
      { userId: 'ana', correctCount: 2, score: 275 },
      { userId: 'marko', correctCount: 2, score: 275 },
      { userId: 'iva', correctCount: 1, score: 140 },
    ];
    expect(partyWinnerIds(players)).toEqual([]);
    expect(findWinnerIds('PARTY', players, 5)).toEqual([]);
  });
});

describe('player outcome', () => {
  const winner = { score: 300, isWinner: true };
  const loser = { score: 100, isWinner: false };

  it('is DONE for solo play', () => {
    expect(playerOutcome('SOLO', loser, [loser])).toBe('DONE');
  });

  it('tells a win, loss and draw apart in a party of two', () => {
    const drawn = { score: 200, isWinner: false };
    expect(playerOutcome('PARTY', winner, [winner, loser])).toBe('WIN');
    expect(playerOutcome('PARTY', loser, [winner, loser])).toBe('LOSS');
    expect(playerOutcome('PARTY', drawn, [drawn, drawn])).toBe('DRAW');
  });

  it('is a draw in a party only for the players who share the top score', () => {
    const top = { score: 300, isWinner: false };
    const players = [top, top, loser];
    expect(playerOutcome('PARTY', top, players)).toBe('DRAW');
    expect(playerOutcome('PARTY', loser, players)).toBe('LOSS');
    expect(playerOutcome('PARTY', winner, [winner, loser, loser])).toBe('WIN');
  });

  it('is a WIN for a team that reached the goal and DONE for one that did not', () => {
    const teammate = { score: 100, isWinner: false };
    expect(playerOutcome('TEAM', winner, [winner, winner])).toBe('WIN');
    expect(playerOutcome('TEAM', teammate, [teammate, teammate])).toBe('DONE');
  });
});

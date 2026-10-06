import { MatchMode } from '@prisma/client';
import { EndStatus } from './matches.types';
import {
  answerPoints,
  FinalStanding,
  MatchEnd,
  playerOutcome,
  secondTryPoints,
  teamWon,
  wrongPartyAnswerPoints,
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

describe('a wrong party answer', () => {
  it('costs 25 points', () => {
    expect(wrongPartyAnswerPoints(140)).toBe(-25);
  });

  it('never takes the score below zero', () => {
    expect(wrongPartyAnswerPoints(10)).toBe(-10);
    expect(wrongPartyAnswerPoints(0)).toBe(0);
  });
});

describe('team result', () => {
  const players = (first: number, second: number) => [
    { correctCount: first },
    { correctCount: second },
  ];

  it('wins together at 60% team accuracy', () => {
    expect(teamWon(players(3, 3), 5)).toBe(true);
    expect(teamWon(players(4, 2), 5)).toBe(true);
  });

  it('loses together below 60%', () => {
    expect(teamWon(players(3, 2), 5)).toBe(false);
  });
});

describe('player outcome', () => {
  const QUESTION_COUNT = 5;
  const stayed = (score: number, correctCount = 0): FinalStanding => ({
    score,
    correctCount,
    connected: true,
  });
  const left = (score: number): FinalStanding => ({ score, correctCount: 0, connected: false });

  function outcomes(mode: MatchMode, players: FinalStanding[], status: EndStatus = 'FINISHED') {
    const end: MatchEnd = { mode, status, questionCount: QUESTION_COUNT, players };
    return players.map((player) => playerOutcome(end, player));
  }

  it('is DONE for solo play', () => {
    expect(outcomes('SOLO', [stayed(750, 5)])).toEqual(['DONE']);
  });

  it('is a WIN for both when the team reaches 60% and DONE when it does not', () => {
    expect(outcomes('TEAM', [stayed(450, 3), stayed(450, 3)])).toEqual(['WIN', 'WIN']);
    expect(outcomes('TEAM', [stayed(300, 2), stayed(450, 3)])).toEqual(['DONE', 'DONE']);
  });

  it('is DONE for an abandoned team, even with enough right answers', () => {
    expect(outcomes('TEAM', [stayed(750, 5), left(750)], 'ABANDONED')).toEqual(['DONE', 'DONE']);
  });

  it('makes the highest score the only party winner', () => {
    expect(outcomes('PARTY', [stayed(275), stayed(260), stayed(0)])).toEqual([
      'WIN',
      'LOSS',
      'LOSS',
    ]);
  });

  it('is a party draw only for the players who share the top score', () => {
    expect(outcomes('PARTY', [stayed(275), stayed(275), stayed(140)])).toEqual([
      'DRAW',
      'DRAW',
      'LOSS',
    ]);
  });

  it('is a LOSS for a leader who left, and a draw for the two who stayed and tie', () => {
    expect(outcomes('PARTY', [left(300), stayed(100), stayed(100)])).toEqual([
      'LOSS',
      'DRAW',
      'DRAW',
    ]);
  });

  it('lets the last player still here win the party', () => {
    expect(outcomes('PARTY', [left(300), stayed(0), left(150)])).toEqual(['LOSS', 'WIN', 'LOSS']);
  });

  it('is a LOSS for everyone when nobody stayed', () => {
    expect(outcomes('PARTY', [left(300), left(300)], 'ABANDONED')).toEqual(['LOSS', 'LOSS']);
  });
});

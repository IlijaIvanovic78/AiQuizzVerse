import { MatchMode } from '@prisma/client';

export type DemoPlayer = 'hero' | 'friend';

export interface SeedRun {
  player: DemoPlayer;
  /** One entry per question, in quiz order: true when the player answered correctly. */
  correct: boolean[];
  /** How much of the answer time was still left, from 0 to 1. Faster answers score more. */
  timeLeft: number;
}

export interface SeedMatch {
  mode: MatchMode;
  quizId: string;
  daysAgo: number;
  /** Spreads matches of the same day: how long before this time of day it ended. */
  minutesEarlier: number;
  /** The first run belongs to the host. */
  runs: SeedRun[];
}

const ALL_RIGHT = [true, true, true, true, true, true];

/**
 * Five days of play between the two demo accounts. demo_hero misses a few questions,
 * which become the cards in the mistakes notebook.
 */
export const DEMO_MATCHES: SeedMatch[] = [
  {
    mode: 'SOLO',
    quizId: 'seed-quiz-javascript',
    daysAgo: 4,
    minutesEarlier: 0,
    runs: [{ player: 'hero', correct: [true, true, true, false, true, true], timeLeft: 0.4 }],
  },
  {
    mode: 'DUEL',
    quizId: 'seed-quiz-animals',
    daysAgo: 3,
    minutesEarlier: 30,
    runs: [
      { player: 'hero', correct: ALL_RIGHT, timeLeft: 0.6 },
      { player: 'friend', correct: [true, false, true, true, false, true], timeLeft: 0.7 },
    ],
  },
  {
    mode: 'SOLO',
    quizId: 'seed-quiz-animals',
    daysAgo: 3,
    minutesEarlier: 0,
    runs: [{ player: 'friend', correct: [true, true, true, true, false, true], timeLeft: 0.5 }],
  },
  {
    mode: 'TEAM',
    quizId: 'seed-quiz-srbija',
    daysAgo: 2,
    minutesEarlier: 0,
    runs: [
      { player: 'hero', correct: [true, true, false, true, true, true], timeLeft: 0.5 },
      { player: 'friend', correct: [true, true, true, true, false, true], timeLeft: 0.4 },
    ],
  },
  {
    mode: 'SOLO',
    quizId: 'seed-quiz-animals',
    daysAgo: 1,
    minutesEarlier: 60,
    runs: [{ player: 'hero', correct: ALL_RIGHT, timeLeft: 0.7 }],
  },
  {
    mode: 'DUEL',
    quizId: 'seed-quiz-solar-system',
    daysAgo: 1,
    minutesEarlier: 0,
    runs: [
      { player: 'friend', correct: ALL_RIGHT, timeLeft: 0.6 },
      { player: 'hero', correct: [true, true, true, true, false, true], timeLeft: 0.5 },
    ],
  },
  {
    mode: 'DUEL',
    quizId: 'seed-quiz-animals',
    daysAgo: 0,
    minutesEarlier: 30,
    runs: [
      { player: 'hero', correct: ALL_RIGHT, timeLeft: 0.6 },
      { player: 'friend', correct: [true, true, false, true, true, true], timeLeft: 0.6 },
    ],
  },
  {
    mode: 'SOLO',
    quizId: 'seed-quiz-solar-system',
    daysAgo: 0,
    minutesEarlier: 0,
    runs: [{ player: 'friend', correct: [true, true, true, false, true, true], timeLeft: 0.5 }],
  },
];

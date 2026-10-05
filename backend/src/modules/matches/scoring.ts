import { MatchMode } from '@prisma/client';
import { accuracyPercent } from '../progression/progression.rules';
import { MatchOutcome } from '../progression/progression.types';
import { BASE_POINTS, SPEED_BONUS_MAX, TEAM_WIN_ACCURACY } from './matches.constants';

export interface PlayerScore {
  userId: string;
  score: number;
  correctCount: number;
}

export function answerPoints(correct: boolean, remainingMs: number, timeLimitMs: number): number {
  if (!correct) {
    return 0;
  }
  const timeLeftShare = Math.min(1, Math.max(0, remainingMs) / timeLimitMs);
  return BASE_POINTS + Math.round(SPEED_BONUS_MAX * timeLeftShare);
}

/** More correct answers wins, then the higher score. A full tie is a draw with no winner. */
export function duelWinnerIds([first, second]: PlayerScore[]): string[] {
  const difference = first.correctCount - second.correctCount || first.score - second.score;
  if (difference === 0) {
    return [];
  }
  return [difference > 0 ? first.userId : second.userId];
}

export function teamWon(players: PlayerScore[], questionCount: number): boolean {
  const teamCorrect = players.reduce((sum, player) => sum + player.correctCount, 0);
  return accuracyPercent(teamCorrect, players.length * questionCount) >= TEAM_WIN_ACCURACY;
}

export function findWinnerIds(
  mode: MatchMode,
  players: PlayerScore[],
  questionCount: number,
): string[] {
  if (mode === 'DUEL') {
    return duelWinnerIds(players);
  }
  if (mode === 'TEAM' && teamWon(players, questionCount)) {
    return players.map((player) => player.userId);
  }
  return [];
}

export function playerOutcome(
  mode: MatchMode,
  isWinner: boolean,
  someoneWon: boolean,
): MatchOutcome {
  if (mode === 'SOLO') {
    return 'DONE';
  }
  if (isWinner) {
    return 'WIN';
  }
  return mode === 'DUEL' && !someoneWon ? 'DRAW' : 'LOSS';
}

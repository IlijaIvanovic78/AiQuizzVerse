import { MatchMode } from '@prisma/client';
import { accuracyPercent } from '../progression/progression.rules';
import { MatchOutcome } from '../progression/progression.types';
import { BASE_POINTS, SPEED_BONUS_MAX, TEAM_WIN_ACCURACY } from './matches.constants';

export interface PlayerScore {
  userId: string;
  score: number;
  correctCount: number;
}

export interface OutcomePlayer {
  score: number;
  isWinner: boolean;
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
  if (first.correctCount !== second.correctCount) {
    return [first.correctCount > second.correctCount ? first.userId : second.userId];
  }
  if (first.score !== second.score) {
    return [first.score > second.score ? first.userId : second.userId];
  }
  return [];
}

export function teamWon(players: PlayerScore[], questionCount: number): boolean {
  const teamCorrect = players.reduce((sum, player) => sum + player.correctCount, 0);
  return accuracyPercent(teamCorrect, players.length * questionCount) >= TEAM_WIN_ACCURACY;
}

/** The highest score wins. A shared top score is a draw with no winner. */
export function partyWinnerIds(players: PlayerScore[]): string[] {
  const topScore = highestScore(players);
  const leaders = players.filter((player) => player.score === topScore);
  return leaders.length === 1 ? [leaders[0].userId] : [];
}

export function findWinnerIds(
  mode: MatchMode,
  players: PlayerScore[],
  questionCount: number,
): string[] {
  if (mode === 'DUEL') {
    return duelWinnerIds(players);
  }
  if (mode === 'PARTY') {
    return partyWinnerIds(players);
  }
  if (mode === 'TEAM' && teamWon(players, questionCount)) {
    return players.map((player) => player.userId);
  }
  return [];
}

export function playerOutcome(
  mode: MatchMode,
  player: OutcomePlayer,
  players: OutcomePlayer[],
): MatchOutcome {
  if (mode === 'SOLO') {
    return 'DONE';
  }
  if (player.isWinner) {
    return 'WIN';
  }
  return isDraw(mode, player, players) ? 'DRAW' : 'LOSS';
}

/** Duels and parties without a winner are a draw for the players who share the top score. */
function isDraw(mode: MatchMode, player: OutcomePlayer, players: OutcomePlayer[]): boolean {
  if (mode !== 'DUEL' && mode !== 'PARTY') {
    return false;
  }
  const someoneWon = players.some((candidate) => candidate.isWinner);
  return !someoneWon && player.score === highestScore(players);
}

function highestScore(players: { score: number }[]): number {
  return Math.max(...players.map((player) => player.score));
}

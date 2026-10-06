import { MatchMode } from '@prisma/client';
import { accuracyPercent } from '../progression/progression.rules';
import { MatchOutcome } from '../progression/progression.types';
import {
  BASE_POINTS,
  PARTY_WRONG_PENALTY,
  SECOND_CHANCE_POINTS,
  SPEED_BONUS_MAX,
  TEAM_WIN_ACCURACY,
} from './matches.constants';

interface PlayerScore {
  userId: string;
  score: number;
  correctCount: number;
}

interface OutcomePlayer {
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

/** The answer after a second chance: no speed bonus, because the player already had a try. */
export function secondTryPoints(correct: boolean): number {
  return correct ? SECOND_CHANCE_POINTS : 0;
}

// A wrong party answer costs PARTY_WRONG_PENALTY points, but never more than the player has,
// so the score never drops below 0.
export function wrongPartyAnswerPoints(score: number): number {
  return score > 0 ? -Math.min(score, PARTY_WRONG_PENALTY) : 0;
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
  if (mode === 'PARTY') {
    return partyWinnerIds(players);
  }
  if (mode === 'TEAM' && teamWon(players, questionCount)) {
    return players.map((player) => player.userId);
  }
  return [];
}

/** Solo play and a team that missed the goal are simply DONE; only a party has losers. */
export function playerOutcome(
  mode: MatchMode,
  player: OutcomePlayer,
  players: OutcomePlayer[],
): MatchOutcome {
  if (player.isWinner) {
    return 'WIN';
  }
  if (mode !== 'PARTY') {
    return 'DONE';
  }
  return isPartyDraw(player, players) ? 'DRAW' : 'LOSS';
}

/** A party without a winner is a draw for the players who share the top score. */
function isPartyDraw(player: OutcomePlayer, players: OutcomePlayer[]): boolean {
  const someoneWon = players.some((candidate) => candidate.isWinner);
  return !someoneWon && player.score === highestScore(players);
}

function highestScore(players: { score: number }[]): number {
  return Math.max(...players.map((player) => player.score));
}

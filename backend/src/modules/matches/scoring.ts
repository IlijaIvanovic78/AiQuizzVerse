import { MatchMode, MatchOutcome } from '@prisma/client';
import { accuracyPercent } from '../progression/progression.rules';
import {
  BASE_POINTS,
  PARTY_WRONG_PENALTY,
  SECOND_CHANCE_POINTS,
  SPEED_BONUS_MAX,
  TEAM_WIN_ACCURACY,
} from './matches.constants';
import { EndStatus } from './matches.types';

/** Where a player stands when the match ends. */
export interface FinalStanding {
  score: number;
  correctCount: number;
  /** Still in the match at the end. In a party only these players can win or draw. */
  connected: boolean;
}

export interface MatchEnd {
  mode: MatchMode;
  status: EndStatus;
  questionCount: number;
  players: FinalStanding[];
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

export function teamWon(players: { correctCount: number }[], questionCount: number): boolean {
  const teamCorrect = players.reduce((sum, player) => sum + player.correctCount, 0);
  return accuracyPercent(teamCorrect, players.length * questionCount) >= TEAM_WIN_ACCURACY;
}

/**
 * Decided once when the match ends; rewards, chests, results and history all use the stored
 * value. Solo play is DONE, and a team wins together when it finished with its goal reached.
 */
export function playerOutcome(end: MatchEnd, player: FinalStanding): MatchOutcome {
  if (end.mode === 'PARTY') {
    return partyOutcome(player, end.players);
  }
  const teamWins =
    end.mode === 'TEAM' && end.status === 'FINISHED' && teamWon(end.players, end.questionCount);
  return teamWins ? 'WIN' : 'DONE';
}

// Leaving a party counts as giving up, even with the most points. Of the players who stayed,
// the top score wins alone, and a shared top score is a draw.
function partyOutcome(player: FinalStanding, players: FinalStanding[]): MatchOutcome {
  const stayed = players.filter((other) => other.connected);
  if (!player.connected || player.score < highestScore(stayed)) {
    return 'LOSS';
  }
  const sharesTopScore = stayed.filter((other) => other.score === player.score).length > 1;
  return sharesTopScore ? 'DRAW' : 'WIN';
}

function highestScore(players: { score: number }[]): number {
  return Math.max(...players.map((player) => player.score));
}

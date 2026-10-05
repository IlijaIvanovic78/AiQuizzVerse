import { MatchMode } from '@prisma/client';
import { PARTY_MAX_CHARGES, PARTY_START_CHARGES, PARTY_WRONG_PENALTY } from './matches.constants';

export interface SabotageAttempt {
  mode: MatchMode;
  questionOpen: boolean;
  fromUserId: string;
  targetUserId: string;
  charges: number;
  alreadySabotaged: boolean;
  /** Null when the target does not play in this match. */
  target: { connected: boolean; canAnswer: boolean } | null;
}

export function startingCharges(mode: MatchMode): number {
  return mode === 'PARTY' ? PARTY_START_CHARGES : 0;
}

export function chargesAfterRoundWin(charges: number): number {
  return Math.min(PARTY_MAX_CHARGES, charges + 1);
}

/** A wrong party answer costs points, but the score never drops below 0. */
export function scoreAfterWrongAnswer(score: number): number {
  return Math.max(0, score - PARTY_WRONG_PENALTY);
}

/** Why a sabotage is not allowed right now, or null when it is. */
export function sabotageError(attempt: SabotageAttempt): string | null {
  if (attempt.mode !== 'PARTY') {
    return 'Sabotage is only for party matches.';
  }
  if (!attempt.questionOpen) {
    return 'Sabotage works only while a question is open.';
  }
  if (attempt.alreadySabotaged) {
    return 'One sabotage per question. Wait for the next one!';
  }
  if (attempt.charges < 1) {
    return 'No sabotage charges left. Win a round to get one!';
  }
  if (attempt.targetUserId === attempt.fromUserId) {
    return 'Pick another player, not yourself.';
  }
  if (!attempt.target) {
    return 'That player is not in this match.';
  }
  if (!attempt.target.connected) {
    return 'That player is not here right now.';
  }
  return attempt.target.canAnswer ? null : 'That player has already answered.';
}

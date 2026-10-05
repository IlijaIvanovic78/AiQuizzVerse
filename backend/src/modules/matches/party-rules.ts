import { MatchMode } from '@prisma/client';
import { PARTY_MAX_CHARGES, PARTY_START_CHARGES, PARTY_WRONG_PENALTY } from './matches.constants';
import { SabotageType } from './matches.types';

export interface SabotageAttempt {
  mode: MatchMode;
  type: SabotageType;
  questionOpen: boolean;
  fromUserId: string;
  charges: number;
  alreadySabotaged: boolean;
  /** Null when the target does not play in this match. A SHIELD targets its own player. */
  target: { userId: string; connected: boolean; canAnswer: boolean } | null;
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

/** Why a sabotage (or a shield) is not allowed right now, or null when it is. */
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
  return attempt.type === 'SHIELD' ? shieldError(attempt) : targetError(attempt);
}

function shieldError(attempt: SabotageAttempt): string | null {
  return attempt.target?.canAnswer ? null : 'A shield only helps before you answer.';
}

function targetError({ target, fromUserId }: SabotageAttempt): string | null {
  if (!target) {
    return 'That player is not in this match.';
  }
  if (target.userId === fromUserId) {
    return 'Pick another player, not yourself.';
  }
  if (!target.connected) {
    return 'That player is not here right now.';
  }
  return target.canAnswer ? null : 'That player has already answered.';
}

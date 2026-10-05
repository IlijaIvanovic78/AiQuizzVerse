import { MatchMode } from '@prisma/client';
import { MatchBoostType } from './matches.types';

export const GAME_NAMESPACE = '/game';
export const MAX_PLAYERS = 2;
export const HISTORY_LIMIT = 20;

export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;

export const MS_PER_SECOND = 1_000;
export const COUNTDOWN_SECONDS = 3;

export const BASE_POINTS = 100;
export const SPEED_BONUS_MAX = 50;
export const TEAM_WIN_ACCURACY = 60;

export const MATCH_BOOST_TYPES: MatchBoostType[] = ['HINT', 'FIFTY_FIFTY', 'EXTRA_TIME'];
export const FREE_HINTS_PER_MATCH = 2;
export const FIFTY_FIFTY_REMOVED_OPTIONS = 2;
export const EXTRA_TIME_MS = 15_000;

/** How long the explanation stays open when not everyone pressed Next. */
export const REVEAL_MAX_MS: Record<MatchMode, number> = {
  SOLO: 60_000,
  DUEL: 15_000,
  TEAM: 15_000,
};

/** How long a disconnected player has to come back before the match goes on without them. */
export const RETURN_GRACE_MS: Record<MatchMode, number> = {
  SOLO: 60_000,
  DUEL: 30_000,
  TEAM: 30_000,
};

// Finishing writes every answer, reward and review card, which can take longer
// than the default 5 s.
export const FINISH_TRANSACTION_TIMEOUT_MS = 15_000;

export const MATCH_NOT_FOUND_MESSAGE = 'We could not find that match.';
export const NOT_IN_MATCH_MESSAGE = 'You are not part of this match.';
export const MATCH_STARTED_MESSAGE = 'This match has already started.';

export function matchRoom(matchId: string): string {
  return `match:${matchId}`;
}

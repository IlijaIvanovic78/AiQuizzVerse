import { MatchMode } from '@prisma/client';
import { MatchBoostType, SabotageType } from './matches.types';

export const GAME_NAMESPACE = '/game';
export const HISTORY_LIMIT = 20;

export const MAX_PLAYERS_BY_MODE: Record<MatchMode, number> = {
  SOLO: 1,
  TEAM: 2,
  PARTY: 4,
};

/** Connected players the host needs before the match can start. */
export const MIN_PLAYERS_TO_START: Record<MatchMode, number> = {
  SOLO: 1,
  TEAM: 2,
  PARTY: 2,
};

export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;

export const MS_PER_SECOND = 1_000;
export const COUNTDOWN_SECONDS = 3;

export const BASE_POINTS = 100;
export const SPEED_BONUS_MAX = 50;
export const TEAM_WIN_ACCURACY = 60;

export const MATCH_BOOST_TYPES: MatchBoostType[] = [
  'HINT',
  'FIFTY_FIFTY',
  'EXTRA_TIME',
  'SECOND_CHANCE',
];
export const FREE_HINTS_PER_MATCH = 2;
export const FIFTY_FIFTY_REMOVED_OPTIONS = 2;
export const EXTRA_TIME_MS = 15_000;
/** A correct answer on the second try earns half the base points and no speed bonus. */
export const SECOND_CHANCE_POINTS = BASE_POINTS / 2;

/** A party keeps going while this many players are connected. */
export const MIN_PARTY_PLAYERS = 2;
export const PARTY_START_CHARGES = 1;
export const PARTY_MAX_CHARGES = 2;
export const PARTY_WRONG_PENALTY = 25;

export const SABOTAGE_TYPES: SabotageType[] = [
  'INK',
  'FREEZE',
  'SCRAMBLE',
  'FOG',
  'QUAKE',
  'MIRROR',
  'SHIELD',
];
/** Everyone can use these without buying them in the shop. */
export const FREE_SABOTAGES: SabotageType[] = ['INK'];
export const INK_DURATION_MS = 4_000;
export const FREEZE_DURATION_MS = 3_000;
export const FOG_DURATION_MS = 4_000;
export const QUAKE_DURATION_MS = 4_000;
export const MIRROR_DURATION_MS = 5_000;
/** SCRAMBLE and SHIELD last until the question ends. */
export const SABOTAGE_DURATION_MS: Record<SabotageType, number> = {
  INK: INK_DURATION_MS,
  FREEZE: FREEZE_DURATION_MS,
  SCRAMBLE: 0,
  FOG: FOG_DURATION_MS,
  QUAKE: QUAKE_DURATION_MS,
  MIRROR: MIRROR_DURATION_MS,
  SHIELD: 0,
};

/** How long the explanation stays open when not everyone pressed Next. */
export const REVEAL_MAX_MS: Record<MatchMode, number> = {
  SOLO: 60_000,
  TEAM: 15_000,
  PARTY: 15_000,
};

// How long a disconnected player has to come back before the match ends without them.
// A party goes on without them and only ends once fewer than two players are left that long.
export const RETURN_GRACE_MS: Record<MatchMode, number> = {
  SOLO: 60_000,
  TEAM: 30_000,
  PARTY: 30_000,
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

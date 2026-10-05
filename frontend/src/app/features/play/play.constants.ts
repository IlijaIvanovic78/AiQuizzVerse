import { MatchMode, SabotageType } from '../../core/models/match.model';

export const MS_PER_SECOND = 1000;

export const TIMER_TICK_MS = 250;
export const TIMER_WARNING_SECONDS = 5;

export const COUNTDOWN_NUMBERS = ['3', '2', '1'];
export const COUNTDOWN_STEP_MS = 750;

// How long the coins fly from the heroes into the chest; the chest opens when they land.
export const COINS_LAND_MS = 620;

export const COUNTER_TICK_MS = 40;
export const COUNTER_STEPS = 25;
export const REVIEW_ROW_DELAY_MS = 350;
export const LEVEL_UP_SOUND_DELAY_MS = 900;

export const TEAM_WIN_ACCURACY = 60;

export const MAX_PLAYERS: Record<MatchMode, number> = { SOLO: 1, DUEL: 2, TEAM: 2, PARTY: 4 };
// Connected players the host needs before the start button works.
export const PLAYERS_TO_START: Record<MatchMode, number> = { SOLO: 1, DUEL: 2, TEAM: 2, PARTY: 2 };

export const PARTY_MAX_CHARGES = 2;
export const PARTY_WRONG_PENALTY = 25;
export const SABOTAGE_LABELS: Record<SabotageType, string> = {
  INK: 'Ink',
  FREEZE: 'Freeze',
  SCRAMBLE: 'Scramble',
};
export const FREEZE_SECONDS = 3;
// How long "X inked Y!" stays on the arena, and how long a scramble shakes the answers.
export const SABOTAGE_NOTICE_MS = 2500;
export const SCRAMBLE_SHAKE_MS = 500;

export const ANSWER_KEYS = ['1', '2', '3', '4'];
export const SHORT_OPTION_LENGTH = 18;
export const NEXT_KEYS = ['Enter', ' '];

// Invite codes are sent in capitals, so a code typed in lowercase is still valid.
export const INVITE_CODE_LENGTH = 6;
export const INVITE_CODE_PATTERN = /^[a-z0-9]{6}$/i;

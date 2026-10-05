import { SabotageType } from '../../core/models/match.model';

export const MS_PER_SECOND = 1000;

export const TIMER_TICK_MS = 250;
export const TIMER_WARNING_SECONDS = 5;

// 3, 2, 1 and the final word take 750 ms each, so together they fill the server's 3 s countdown.
export const COUNTDOWN_NUMBERS = ['3', '2', '1'];
export const COUNTDOWN_STEP_MS = 750;

// How long the coins fly from the heroes into the chest; the chest opens when they land.
export const COINS_LAND_MS = 620;

export const COUNTER_TICK_MS = 40;
export const COUNTER_STEPS = 25;
export const REVIEW_ROW_DELAY_MS = 350;
// The level-up jingle and the level-up banner on the results appear together.
export const LEVEL_UP_DELAY_MS = 900;

export const TEAM_WIN_ACCURACY = 60;
export const EXTRA_TIME_SECONDS = 15;

export const PARTY_MAX_CHARGES = 2;
export const PARTY_WRONG_PENALTY = 25;
// How long "X inked Y!" stays on the arena, and how long a scramble shakes the answers.
export const SABOTAGE_NOTICE_MS = 2500;
export const SCRAMBLE_SHAKE_MS = 500;

const FREEZE_SECONDS = 3;

interface SabotageText {
  label: string;
  // As in "demo_friend inked you!"
  pastVerb: string;
  // As in "Who do you want to splash with ink?"
  promptVerb: string;
  description: string;
}

export const SABOTAGES: Record<SabotageType, SabotageText> = {
  INK: {
    label: 'Ink',
    pastVerb: 'inked',
    promptVerb: 'splash with ink',
    description: 'Splash ink on their question',
  },
  FREEZE: {
    label: 'Freeze',
    pastVerb: 'froze',
    promptVerb: 'freeze',
    description: `No answering for ${FREEZE_SECONDS} seconds`,
  },
  SCRAMBLE: {
    label: 'Scramble',
    pastVerb: 'scrambled',
    promptVerb: 'scramble',
    description: 'Mix up their answers',
  },
};

export const ANSWER_KEYS = ['1', '2', '3', '4'];
export const SHORT_OPTION_LENGTH = 18;
export const NEXT_KEYS = ['Enter', ' '];

export const INVITE_CODE_LENGTH = 6;
// Invite codes are sent in capitals, so a code typed in lowercase is still valid.
export const INVITE_CODE_PATTERN = /^[a-z0-9]{6}$/i;

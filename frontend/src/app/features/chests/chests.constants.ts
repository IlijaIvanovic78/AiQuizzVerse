import { ChestType } from '../../core/models/chest.model';

export const CHESTS_URL = '/assets/images/chests/';
export const CHEST_FRAME_SIZE = 32;
export const CHEST_FRAME_COUNT = 4;

// The chest wobbles at least this long, so the lid never pops before the player saw it shake.
export const CHEST_SHAKE_MS = 900;
// How long the lid takes to open; the reward pops out right after.
export const LID_OPEN_MS = 400;

interface EarnWay {
  type: ChestType;
  ways: string;
}

export const HOW_TO_EARN: EarnWay[] = [
  {
    type: 'WOODEN',
    ways: 'Your first game of the day with 60% or more, a duel or party win (two a day), and path steps 1 and 3.',
  },
  { type: 'SILVER', ways: 'Every new level, and path steps 2 and 4.' },
  { type: 'GOLDEN', ways: 'Every 7 days of your streak, and the last step of a path.' },
];

// Small pixel sparkles around the opened chest, in percent of the chest picture.
export const SPARKLES = [
  { left: -6, top: 18, delayMs: 0 },
  { left: 96, top: 10, delayMs: 120 },
  { left: 8, top: -8, delayMs: 240 },
  { left: 84, top: 64, delayMs: 360 },
  { left: -10, top: 70, delayMs: 180 },
  { left: 50, top: -14, delayMs: 300 },
];

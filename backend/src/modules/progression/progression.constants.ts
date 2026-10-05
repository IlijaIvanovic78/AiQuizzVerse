import { Reward } from './progression.types';

export const XP_CURVE_FACTOR = 50;

export const XP_PER_CORRECT = 10;
export const COINS_PER_CORRECT = 2;
export const HARD_XP_MULTIPLIER = 1.5;

export const NO_REWARD: Reward = { xp: 0, coins: 0 };
export const FINISH_BONUS: Reward = { xp: 10, coins: 5 };
export const DUEL_WIN_BONUS: Reward = { xp: 30, coins: 15 };
export const DUEL_DRAW_BONUS: Reward = { xp: 10, coins: 5 };
export const TEAM_WIN_BONUS: Reward = { xp: 20, coins: 10 };

export const STREAK_BONUS_COINS_PER_DAY = 5;
export const MAX_STREAK_BONUS_COINS = 30;
export const STREAK_FREEZE_MIN_GAP_DAYS = 2;

export const DAILY_MATCH_COIN_CAP = 150;

export const ONE_STAR_ACCURACY = 60;
export const TWO_STARS_ACCURACY = 80;
export const THREE_STARS_ACCURACY = 100;

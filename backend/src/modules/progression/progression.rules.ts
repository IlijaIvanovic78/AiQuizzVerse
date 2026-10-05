import { Difficulty, MatchMode } from '@prisma/client';
import { daysBetween } from '../../common/utils/dates';
import {
  COINS_PER_CORRECT,
  DAILY_MATCH_COIN_CAP,
  DUEL_DRAW_BONUS,
  DUEL_WIN_BONUS,
  FINISH_BONUS,
  HARD_XP_MULTIPLIER,
  MAX_STREAK_BONUS_COINS,
  NO_REWARD,
  ONE_STAR_ACCURACY,
  PARTY_DRAW_BONUS,
  PARTY_WIN_BONUS,
  STREAK_BONUS_COINS_PER_DAY,
  STREAK_FREEZE_GAP_DAYS,
  TEAM_WIN_BONUS,
  THREE_STARS_ACCURACY,
  TWO_STARS_ACCURACY,
  XP_CURVE_FACTOR,
  XP_PER_CORRECT,
} from './progression.constants';
import {
  LevelProgress,
  MatchOutcome,
  MatchRewardInput,
  Reward,
  StreakState,
} from './progression.types';

export function xpForLevel(level: number): number {
  return XP_CURVE_FACTOR * (level - 1) ** 2;
}

export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / XP_CURVE_FACTOR)) + 1;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  return {
    level,
    xpIntoLevel: xp - xpForLevel(level),
    xpForNextLevel: xpForLevel(level + 1) - xpForLevel(level),
  };
}

export function accuracyPercent(correct: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.floor((correct * 100) / total);
}

export function starsForAccuracy(accuracy: number): number {
  if (accuracy >= THREE_STARS_ACCURACY) {
    return 3;
  }
  if (accuracy >= TWO_STARS_ACCURACY) {
    return 2;
  }
  return accuracy >= ONE_STAR_ACCURACY ? 1 : 0;
}

export function needsStreakFreeze(daysSinceLastPlay: number | null): boolean {
  return daysSinceLastPlay === STREAK_FREEZE_GAP_DAYS;
}

/** The streak players see: it drops to 0 as soon as the next game could no longer continue it. */
export function displayedStreak(state: StreakState, today: Date): number {
  if (!state.lastPlayedOn) {
    return state.streak;
  }
  const daysSinceLastPlay = daysBetween(state.lastPlayedOn, today);
  if (daysSinceLastPlay <= 1) {
    return state.streak;
  }
  const freezeCanSaveIt = needsStreakFreeze(daysSinceLastPlay) && state.streakFreezes > 0;
  return freezeCanSaveIt ? state.streak : 0;
}

export function nextStreak(
  streak: number,
  daysSinceLastPlay: number | null,
  usedFreeze: boolean,
): number {
  if (daysSinceLastPlay === 0) {
    return streak;
  }
  if (daysSinceLastPlay === 1 || usedFreeze) {
    return streak + 1;
  }
  return 1;
}

export function streakBonusCoins(streak: number): number {
  return Math.min(streak * STREAK_BONUS_COINS_PER_DAY, MAX_STREAK_BONUS_COINS);
}

export function capMatchCoins(coins: number, coinsEarnedToday: number): number {
  const roomLeft = Math.max(0, DAILY_MATCH_COIN_CAP - coinsEarnedToday);
  return Math.min(coins, roomLeft);
}

export function matchReward(input: MatchRewardInput): Reward {
  const rewards = [answerReward(input.correctCount, input.difficulty)];
  if (!input.abandoned) {
    rewards.push(finishBonus(input.correctCount), outcomeBonus(input.mode, input.outcome));
  }
  return rewards.reduce(addRewards, NO_REWARD);
}

function addRewards(first: Reward, second: Reward): Reward {
  return { xp: first.xp + second.xp, coins: first.coins + second.coins };
}

function answerReward(correctCount: number, difficulty: Difficulty): Reward {
  const multiplier = difficulty === 'HARD' ? HARD_XP_MULTIPLIER : 1;
  return {
    xp: Math.round(correctCount * XP_PER_CORRECT * multiplier),
    coins: correctCount * COINS_PER_CORRECT,
  };
}

function finishBonus(correctCount: number): Reward {
  return correctCount > 0 ? FINISH_BONUS : NO_REWARD;
}

function outcomeBonus(mode: MatchMode, outcome: MatchOutcome): Reward {
  if (mode === 'DUEL' && outcome === 'WIN') {
    return DUEL_WIN_BONUS;
  }
  if (mode === 'DUEL' && outcome === 'DRAW') {
    return DUEL_DRAW_BONUS;
  }
  if (mode === 'TEAM' && outcome === 'WIN') {
    return TEAM_WIN_BONUS;
  }
  if (mode === 'PARTY' && outcome === 'WIN') {
    return PARTY_WIN_BONUS;
  }
  if (mode === 'PARTY' && outcome === 'DRAW') {
    return PARTY_DRAW_BONUS;
  }
  return NO_REWARD;
}

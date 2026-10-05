import {
  accuracyPercent,
  capMatchCoins,
  levelForXp,
  levelProgress,
  matchReward,
  needsStreakFreeze,
  nextStreak,
  starsForAccuracy,
  streakBonusCoins,
  xpForLevel,
} from './progression.rules';
import { MatchRewardInput } from './progression.types';

describe('levels', () => {
  it('starts every player at level 1', () => {
    expect(levelForXp(0)).toBe(1);
    expect(xpForLevel(1)).toBe(0);
  });

  it('follows the 50 * (level - 1)^2 curve', () => {
    expect(xpForLevel(2)).toBe(50);
    expect(xpForLevel(3)).toBe(200);
    expect(xpForLevel(5)).toBe(800);
  });

  it('levels up exactly at the threshold', () => {
    expect(levelForXp(49)).toBe(1);
    expect(levelForXp(50)).toBe(2);
    expect(levelForXp(199)).toBe(2);
    expect(levelForXp(200)).toBe(3);
  });

  it('describes progress inside the current level', () => {
    expect(levelProgress(1200)).toEqual({ level: 5, xpIntoLevel: 400, xpForNextLevel: 450 });
  });
});

describe('stars', () => {
  it('rounds accuracy down so only a perfect run is 100%', () => {
    expect(accuracyPercent(14, 15)).toBe(93);
    expect(accuracyPercent(15, 15)).toBe(100);
    expect(accuracyPercent(0, 0)).toBe(0);
  });

  it('gives 0 to 3 stars at 60, 80 and 100 percent', () => {
    expect(starsForAccuracy(59)).toBe(0);
    expect(starsForAccuracy(60)).toBe(1);
    expect(starsForAccuracy(80)).toBe(2);
    expect(starsForAccuracy(99)).toBe(2);
    expect(starsForAccuracy(100)).toBe(3);
  });
});

describe('daily streak', () => {
  it('starts at 1 on the first game', () => {
    expect(nextStreak(0, null, false)).toBe(1);
  });

  it('does not change when playing again on the same day', () => {
    expect(nextStreak(4, 0, false)).toBe(4);
  });

  it('grows when playing on the next day', () => {
    expect(nextStreak(4, 1, false)).toBe(5);
  });

  it('resets after a missed day without a freeze', () => {
    expect(nextStreak(4, 3, false)).toBe(1);
  });

  it('keeps growing after a missed day when a freeze was used', () => {
    expect(nextStreak(4, 3, true)).toBe(5);
  });

  it('only asks for a freeze when at least one day was missed', () => {
    expect(needsStreakFreeze(null)).toBe(false);
    expect(needsStreakFreeze(1)).toBe(false);
    expect(needsStreakFreeze(2)).toBe(true);
  });

  it('pays 5 coins per streak day, up to 30', () => {
    expect(streakBonusCoins(1)).toBe(5);
    expect(streakBonusCoins(6)).toBe(30);
    expect(streakBonusCoins(20)).toBe(30);
  });
});

describe('daily coin cap', () => {
  it('pays everything while under the cap', () => {
    expect(capMatchCoins(40, 100)).toBe(40);
  });

  it('pays only what is left before the cap', () => {
    expect(capMatchCoins(40, 130)).toBe(20);
  });

  it('pays nothing once the cap is reached', () => {
    expect(capMatchCoins(40, 150)).toBe(0);
    expect(capMatchCoins(40, 180)).toBe(0);
  });
});

describe('match rewards', () => {
  const solo: MatchRewardInput = {
    mode: 'SOLO',
    difficulty: 'EASY',
    correctCount: 4,
    outcome: 'DONE',
    abandoned: false,
  };

  it('pays per correct answer plus the finish bonus', () => {
    expect(matchReward(solo)).toEqual({ xp: 50, coins: 13 });
  });

  it('gives nothing for a game without correct answers', () => {
    expect(matchReward({ ...solo, correctCount: 0 })).toEqual({ xp: 0, coins: 0 });
  });

  it('gives 1.5x answer XP on hard quizzes', () => {
    expect(matchReward({ ...solo, difficulty: 'HARD', correctCount: 3 })).toEqual({
      xp: 55,
      coins: 11,
    });
  });

  it('adds the duel winner and draw bonuses', () => {
    const duel: MatchRewardInput = { ...solo, mode: 'DUEL', correctCount: 1 };

    expect(matchReward({ ...duel, outcome: 'WIN' })).toEqual({ xp: 50, coins: 22 });
    expect(matchReward({ ...duel, outcome: 'DRAW' })).toEqual({ xp: 30, coins: 12 });
    expect(matchReward({ ...duel, outcome: 'LOSS' })).toEqual({ xp: 20, coins: 7 });
  });

  it('adds the team bonus when the team wins', () => {
    expect(matchReward({ ...solo, mode: 'TEAM', outcome: 'WIN' })).toEqual({ xp: 70, coins: 23 });
  });

  it('pays only for correct answers in an abandoned match', () => {
    expect(matchReward({ ...solo, mode: 'TEAM', outcome: 'WIN', abandoned: true })).toEqual({
      xp: 40,
      coins: 8,
    });
  });
});

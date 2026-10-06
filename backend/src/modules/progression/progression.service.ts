import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { daysBetween, utcToday } from '../../common/utils/dates';
import { PrismaService } from '../../prisma/prisma.service';
import {
  capMatchCoins,
  levelForXp,
  matchReward,
  needsStreakFreeze,
  nextStreak,
  streakBonusCoins,
} from './progression.rules';
import { MatchRewardInput, PlayerReward } from './progression.types';

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  async rewardMatchPlayer(
    userId: string,
    input: MatchRewardInput,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<PlayerReward> {
    const today = utcToday();
    const reward = matchReward(input);
    const newStreak = input.correctCount > 0 ? await this.updateStreak(db, userId, today) : null;
    const streakBonus = newStreak === null || input.abandoned ? 0 : streakBonusCoins(newStreak);
    const wantedCoins = reward.coins + streakBonus;
    const coinsEarnedToday = await this.matchCoinsEarnedSince(db, userId, today);
    const coinsEarned = capMatchCoins(wantedCoins, coinsEarnedToday);

    const user = await db.user.update({
      where: { id: userId },
      data: { xp: { increment: reward.xp }, coins: { increment: coinsEarned } },
      select: { xp: true },
    });

    const levelsGained = levelForXp(user.xp) - levelForXp(user.xp - reward.xp);
    return {
      xpEarned: reward.xp,
      coinsEarned,
      leveledUp: levelsGained > 0,
      levelsGained,
      coinCapReached: coinsEarned < wantedCoins,
      newStreak,
    };
  }

  /** Returns the new streak, or null when the player already played today. */
  private async updateStreak(
    db: Prisma.TransactionClient,
    userId: string,
    today: Date,
  ): Promise<number | null> {
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { streak: true, longestStreak: true, lastPlayedOn: true },
    });
    const daysSinceLastPlay = user.lastPlayedOn ? daysBetween(user.lastPlayedOn, today) : null;
    if (daysSinceLastPlay === 0) {
      return null;
    }

    const usedFreeze =
      needsStreakFreeze(daysSinceLastPlay) && (await this.useStreakFreeze(db, userId));
    const streak = nextStreak(user.streak, daysSinceLastPlay, usedFreeze);
    await db.user.update({
      where: { id: userId },
      data: { streak, longestStreak: Math.max(user.longestStreak, streak), lastPlayedOn: today },
    });
    return streak;
  }

  private async useStreakFreeze(db: Prisma.TransactionClient, userId: string): Promise<boolean> {
    const { count } = await db.userBoost.updateMany({
      where: { userId, type: 'STREAK_FREEZE', quantity: { gte: 1 } },
      data: { quantity: { decrement: 1 } },
    });
    return count === 1;
  }

  private async matchCoinsEarnedSince(
    db: Prisma.TransactionClient,
    userId: string,
    since: Date,
  ): Promise<number> {
    const { _sum } = await db.matchPlayer.aggregate({
      _sum: { coinsEarned: true },
      where: { userId, match: { endedAt: { gte: since } } },
    });
    return _sum.coinsEarned ?? 0;
  }
}

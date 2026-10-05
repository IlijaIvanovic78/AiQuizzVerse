import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { startOfUtcWeek } from '../../common/utils/dates';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendsService } from '../friends/friends.service';
import { PUBLIC_USER_SELECT, toPublicUser } from '../users/user.mapper';
import { GLOBAL_LEADERBOARD_SIZE } from './leaderboard.constants';
import { rankPlayers } from './leaderboard.rules';
import {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardMe,
  LeaderboardScope,
} from './leaderboard.types';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
  ) {}

  async getLeaderboard(userId: string, scope: LeaderboardScope): Promise<Leaderboard> {
    const weekStart = startOfUtcWeek(new Date());
    const entries =
      scope === 'friends'
        ? await this.friendsEntries(userId, weekStart)
        : await this.globalEntries(weekStart);

    const mine = entries.find((entry) => entry.user.id === userId);
    const me = mine
      ? { rank: mine.rank, weeklyXp: mine.weeklyXp }
      : await this.findGlobalRank(userId, weekStart);
    return { period: 'week', entries, me };
  }

  /** The friends board lists every friend, also the ones without XP this week. */
  private async friendsEntries(userId: string, weekStart: Date): Promise<LeaderboardEntry[]> {
    const playerIds = [userId, ...(await this.friends.findFriendIds(userId))];
    const xpByUser = await this.weeklyXpByUser(weekStart, { userId: { in: playerIds } });
    return this.toEntries(playerIds, xpByUser);
  }

  private async globalEntries(weekStart: Date): Promise<LeaderboardEntry[]> {
    const xpByUser = await this.weeklyXpByUser(weekStart, {}, GLOBAL_LEADERBOARD_SIZE);
    return this.toEntries([...xpByUser.keys()], xpByUser);
  }

  /** For a player below the global top list: one more than the number of players ahead. */
  private async findGlobalRank(userId: string, weekStart: Date): Promise<LeaderboardMe> {
    const mine = await this.weeklyXpByUser(weekStart, { userId });
    const weeklyXp = mine.get(userId) ?? 0;
    if (weeklyXp === 0) {
      return { rank: null, weeklyXp };
    }

    const playersAhead = await this.prisma.matchPlayer.groupBy({
      by: ['userId'],
      where: { match: endedSince(weekStart) },
      having: { xpEarned: { _sum: { gt: weeklyXp } } },
    });
    return { rank: playersAhead.length + 1, weeklyXp };
  }

  private async weeklyXpByUser(
    weekStart: Date,
    where: Prisma.MatchPlayerWhereInput,
    limit?: number,
  ): Promise<Map<string, number>> {
    const totals = await this.prisma.matchPlayer.groupBy({
      by: ['userId'],
      where: { ...where, match: endedSince(weekStart) },
      _sum: { xpEarned: true },
      having: { xpEarned: { _sum: { gt: 0 } } },
      orderBy: { _sum: { xpEarned: 'desc' } },
      take: limit,
    });
    return new Map(totals.map((total) => [total.userId, total._sum.xpEarned ?? 0]));
  }

  private async toEntries(
    userIds: string[],
    xpByUser: Map<string, number>,
  ): Promise<LeaderboardEntry[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: PUBLIC_USER_SELECT,
    });
    return rankPlayers(
      users.map((user) => ({ user: toPublicUser(user), weeklyXp: xpByUser.get(user.id) ?? 0 })),
    );
  }
}

// Abandoned team matches still pay XP for correct answers, so every ended match counts.
function endedSince(weekStart: Date): Prisma.MatchWhereInput {
  return { endedAt: { gte: weekStart } };
}

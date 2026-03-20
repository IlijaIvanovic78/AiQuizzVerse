import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LEADERBOARD_LIMIT } from '../../core/constants';

const LEADERBOARD_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
  xp: true,
  level: true,
  streak: true,
} as const;

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Top users globally, ordered by XP descending */
  async getGlobalLeaderboard() {
    return this.prisma.user.findMany({
      select: LEADERBOARD_SELECT,
      orderBy: { xp: 'desc' },
      take: LEADERBOARD_LIMIT,
    });
  }

  /** Leaderboard scoped to the user's accepted friends + themselves */
  async getFriendsLeaderboard(userId: string) {
    // Gather all accepted friend user IDs
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });

    const friendIds = friendships.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId,
    );

    // Include the current user in the leaderboard
    const userIds = [...new Set([userId, ...friendIds])];

    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: LEADERBOARD_SELECT,
      orderBy: { xp: 'desc' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { User } from '@prisma/client';
import { calculateLevel, STREAK_BONUS_COINS, MAX_STREAK_BONUS } from '../../core/constants';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(data: { email: string; username: string; passwordHash: string }): Promise<User> {
    // passwordHash is already hashed by AuthService
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
      },
    });
  }

  async updateRefreshToken(userId: string, hashedRefreshToken: string | null): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async update2FASecret(userId: string, secret: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFaSecret: secret },
    });
  }

  async enable2FA(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFaEnabled: true },
    });
  }

  async disable2FA(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { 
        twoFaEnabled: false,
        twoFaSecret: null,
      },
    });
  }

  async addRewards(userId: string, xp: number, coins: number): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xp },
        coins: { increment: coins },
      },
    });
    const newLevel = calculateLevel(user.xp);
    if (newLevel !== user.level) {
      return this.prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }
    return user;
  }

  /**
   * Update daily streak after completing a match.
   * - Same day → no-op
   * - Consecutive day → increment streak
   * - Gap > 1 day or first play → reset to 1
   * Awards bonus coins based on streak length.
   */
  async updateStreak(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (user.lastPlayedAt) {
      const lastUTC = new Date(
        Date.UTC(
          user.lastPlayedAt.getUTCFullYear(),
          user.lastPlayedAt.getUTCMonth(),
          user.lastPlayedAt.getUTCDate(),
        ),
      );
      const diffDays = Math.floor((todayUTC.getTime() - lastUTC.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already played today — no streak change
        return user;
      }

      if (diffDays === 1) {
        // Consecutive day — increment streak
        const newStreak = user.streak + 1;
        const bonusCoins = Math.min(newStreak * STREAK_BONUS_COINS, MAX_STREAK_BONUS);
        return this.prisma.user.update({
          where: { id: userId },
          data: {
            streak: newStreak,
            longestStreak: Math.max(newStreak, user.longestStreak),
            lastPlayedAt: now,
            coins: { increment: bonusCoins },
          },
        });
      }
    }

    // First play or gap > 1 day — reset streak to 1
    const bonusCoins = Math.min(1 * STREAK_BONUS_COINS, MAX_STREAK_BONUS);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        streak: 1,
        longestStreak: Math.max(1, user.longestStreak),
        lastPlayedAt: now,
        coins: { increment: bonusCoins },
      },
    });
  }
}

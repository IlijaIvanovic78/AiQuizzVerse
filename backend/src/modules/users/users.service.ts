import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { User } from '@prisma/client';
import { calculateLevel } from '../../core/constants';

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
}

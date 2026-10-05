import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toCurrentUser } from './user.mapper';
import { STARTER_BOOSTS } from './users.constants';
import { CurrentUser, NewUser } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('We could not find your account.');
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    return count > 0;
  }

  async findCurrentUser(id: string): Promise<CurrentUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { boosts: { where: { type: 'STREAK_FREEZE' } } },
    });
    if (!user) {
      throw new NotFoundException('We could not find your account.');
    }
    return toCurrentUser(user, user.boosts[0]?.quantity ?? 0);
  }

  create(data: NewUser): Promise<User> {
    return this.prisma.user.create({
      data: { ...data, boosts: { create: STARTER_BOOSTS } },
    });
  }

  async setRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { refreshTokenHash } });
  }

  async setTwoFaSecret(id: string, twoFaSecret: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { twoFaSecret, twoFaEnabled: false } });
  }

  async enableTwoFa(id: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { twoFaEnabled: true } });
  }

  async disableTwoFa(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { twoFaEnabled: false, twoFaSecret: null },
    });
  }
}

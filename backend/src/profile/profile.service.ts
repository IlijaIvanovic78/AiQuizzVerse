import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        xp: true,
        coins: true,
        level: true,
        twoFaEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sentRequests: {
              where: { status: 'ACCEPTED' },
            },
            receivedRequests: {
              where: { status: 'ACCEPTED' },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate total friends (accepted friendships where user is sender or receiver)
    const friendsCount = user._count.sentRequests + user._count.receivedRequests;

    // Remove _count from response and add friendsCount
    const { _count, ...userData } = user;

    return {
      ...userData,
      friendsCount,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check if username is taken (if username is being changed)
    if (dto.username) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Username is already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        xp: true,
        coins: true,
        level: true,
        twoFaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}

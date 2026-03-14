import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';
import { EventsGateway } from '../gateway/events.gateway';
import { USER_PUBLIC_SELECT, USER_PUBLIC_WITH_XP_SELECT } from '../../shared/constants/prisma-selects';
import { SEARCH_RESULTS_LIMIT } from '../../core/constants/app.constants';

@Injectable()
export class FriendshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async sendRequest(senderId: string, receiverId: string) {
    // Can't send request to yourself
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if friendship already exists (either direction)
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('You are already friends');
      } else {
        throw new BadRequestException('Friend request already sent');
      }
    }

    // Create friendship request
    const friendship = await this.prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        sender: {
          select: USER_PUBLIC_SELECT,
        },
        receiver: {
          select: USER_PUBLIC_SELECT,
        },
      },
    });

    // Emit socket event to receiver if online
    this.eventsGateway.emitFriendRequestSent(receiverId, {
      id: friendship.sender.id,
      username: friendship.sender.username,
      email: friendship.sender.email,
      avatarUrl: friendship.sender.avatarUrl,
      level: friendship.sender.level,
      friendshipId: friendship.id,
    });

    return friendship;
  }

  async acceptRequest(friendshipId: string, userId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Only the receiver can accept
    if (friendship.receiverId !== userId) {
      throw new ForbiddenException('You can only accept requests sent to you');
    }

    // Can't accept already accepted request
    if (friendship.status === FriendshipStatus.ACCEPTED) {
      throw new BadRequestException('Friend request already accepted');
    }

    // Update status to ACCEPTED
    const updatedFriendship = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        sender: {
          select: USER_PUBLIC_SELECT,
        },
        receiver: {
          select: USER_PUBLIC_SELECT,
        },
      },
    });

    // Emit socket event to sender (original requester) if online
    this.eventsGateway.emitFriendRequestAccepted(updatedFriendship.senderId, {
      id: updatedFriendship.receiver.id,
      username: updatedFriendship.receiver.username,
      email: updatedFriendship.receiver.email,
      avatarUrl: updatedFriendship.receiver.avatarUrl,
      level: updatedFriendship.receiver.level,
      friendshipId: updatedFriendship.id,
    });

    return updatedFriendship;
  }

  async rejectRequest(friendshipId: string, userId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Only the receiver can reject
    if (friendship.receiverId !== userId) {
      throw new ForbiddenException('You can only reject requests sent to you');
    }

    // Delete the friendship request
    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return { message: 'Friend request rejected' };
  }

  async removeFriend(friendshipId: string, userId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // Only participants can remove friendship
    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      throw new ForbiddenException('You can only remove your own friendships');
    }

    // Delete the friendship
    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return { message: 'Friend removed' };
  }

  async getFriends(userId: string) {
    // Get all ACCEPTED friendships where user is sender or receiver
    const friendships = await this.prisma.friendship.findMany({
      where: {
        AND: [
          {
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
          {
            status: FriendshipStatus.ACCEPTED,
          },
        ],
      },
      include: {
        sender: {
          select: USER_PUBLIC_WITH_XP_SELECT,
        },
        receiver: {
          select: USER_PUBLIC_WITH_XP_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to return the friend (not the current user)
    return friendships.map((friendship) => {
      const friend =
        friendship.senderId === userId
          ? friendship.receiver
          : friendship.sender;
      return {
        friendshipId: friendship.id,
        friend,
        isOnline: this.eventsGateway.isUserOnline(friend.id),
        since: friendship.createdAt,
      };
    });
  }

  async getPendingRequests(userId: string) {
    // Get requests where current user is the receiver (incoming requests)
    const requests = await this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        sender: {
          select: USER_PUBLIC_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((request) => ({
      id: request.id,
      from: request.sender,
      createdAt: request.createdAt,
    }));
  }

  async getSentRequests(userId: string) {
    // Get requests where current user is the sender (outgoing requests)
    const requests = await this.prisma.friendship.findMany({
      where: {
        senderId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        receiver: {
          select: USER_PUBLIC_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((request) => ({
      id: request.id,
      to: request.receiver,
      createdAt: request.createdAt,
    }));
  }

  async searchUsers(query: string, currentUserId: string) {
    // Search users by username (case-insensitive ILIKE)
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            id: {
              not: currentUserId, // Exclude current user
            },
          },
        ],
      },
      select: USER_PUBLIC_WITH_XP_SELECT,
      take: SEARCH_RESULTS_LIMIT,
      orderBy: { username: 'asc' },
    });

    // For each user, check friendship status
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendship = await this.prisma.friendship.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: user.id },
              { senderId: user.id, receiverId: currentUserId },
            ],
          },
        });

        let friendshipStatus: 'none' | 'pending' | 'accepted' = 'none';
        let friendshipId: string | null = null;

        if (friendship) {
          friendshipId = friendship.id;
          if (friendship.status === FriendshipStatus.ACCEPTED) {
            friendshipStatus = 'accepted';
          } else {
            friendshipStatus = 'pending';
          }
        }

        return {
          ...user,
          friendshipStatus,
          friendshipId,
        };
      }),
    );

    return usersWithStatus;
  }
}

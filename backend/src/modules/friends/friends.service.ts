import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Friendship, FriendshipStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../realtime/notifications.service';
import { PresenceService } from '../realtime/presence.service';
import { PUBLIC_USER_SELECT, toPublicUser } from '../users/user.mapper';
import {
  acceptedFriendshipsOf,
  FRIENDSHIP_USERS_INCLUDE,
  FriendshipWithUsers,
  involving,
  otherUserId,
  relationTo,
  toFriend,
  toFriendRequest,
} from './friend.mapper';
import {
  PLAYER_NOT_FOUND_MESSAGE,
  REQUEST_NOT_FOUND_MESSAGE,
  SEARCH_RESULT_LIMIT,
} from './friends.constants';
import {
  Friend,
  FriendRequestOutcome,
  FriendRequests,
  RelationInfo,
  UserSearchResult,
} from './friends.types';

interface SavedRequest {
  friendship: FriendshipWithUsers;
  accepted: boolean;
}

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
    private readonly notifications: NotificationsService,
  ) {}

  async listFriends(userId: string): Promise<Friend[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: acceptedFriendshipsOf(userId),
      include: FRIENDSHIP_USERS_INCLUDE,
    });
    return friendships
      .map((friendship) => this.friendFor(friendship, userId))
      .sort(byOnlineThenName);
  }

  async findFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: acceptedFriendshipsOf(userId),
      select: { senderId: true, receiverId: true },
    });
    return friendships.map((friendship) => otherUserId(friendship, userId));
  }

  async listRequests(userId: string): Promise<FriendRequests> {
    const [incoming, outgoing] = await Promise.all([
      this.findPendingRequests({ receiverId: userId }),
      this.findPendingRequests({ senderId: userId }),
    ]);
    return {
      incoming: incoming.map((request) => toFriendRequest(request, userId)),
      outgoing: outgoing.map((request) => toFriendRequest(request, userId)),
    };
  }

  async search(userId: string, query: string): Promise<UserSearchResult[]> {
    const users = await this.prisma.user.findMany({
      where: { id: { not: userId }, username: { contains: query, mode: 'insensitive' } },
      select: PUBLIC_USER_SELECT,
      orderBy: { username: 'asc' },
      take: SEARCH_RESULT_LIMIT,
    });
    const userIds = users.map((user) => user.id);
    const friendships = await this.prisma.friendship.findMany({ where: between(userId, userIds) });
    const friendshipByUser = new Map(
      friendships.map((friendship) => [otherUserId(friendship, userId), friendship]),
    );

    return users.map((user) => ({
      user: toPublicUser(user),
      ...relationTo(friendshipByUser.get(user.id) ?? null, userId),
    }));
  }

  async findRelation(viewerId: string, otherId: string): Promise<RelationInfo> {
    const friendship = await this.prisma.friendship.findFirst({
      where: between(viewerId, [otherId]),
    });
    return relationTo(friendship, viewerId);
  }

  async sendRequest(userId: string, receiverId: string): Promise<FriendRequestOutcome> {
    if (receiverId === userId) {
      throw new BadRequestException("You can't add yourself as a friend.");
    }
    await this.assertUserExists(receiverId);

    const { friendship, accepted } = await this.prisma.$transaction((tx) =>
      this.createOrAcceptRequest(tx, userId, receiverId),
    );
    if (accepted) {
      this.notifyAccepted(friendship, userId);
      return { status: 'ACCEPTED', request: null, friend: this.friendFor(friendship, userId) };
    }

    this.notifications.emitToUser(
      receiverId,
      'friend:request',
      toFriendRequest(friendship, receiverId),
    );
    return { status: 'SENT', request: toFriendRequest(friendship, userId), friend: null };
  }

  async acceptRequest(userId: string, requestId: string): Promise<Friend> {
    const { count } = await this.prisma.friendship.updateMany({
      where: { id: requestId, receiverId: userId, status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });
    if (count === 0) {
      throw new NotFoundException(REQUEST_NOT_FOUND_MESSAGE);
    }

    const friendship = await this.prisma.friendship.findUniqueOrThrow({
      where: { id: requestId },
      include: FRIENDSHIP_USERS_INCLUDE,
    });
    this.notifyAccepted(friendship, userId);
    return this.friendFor(friendship, userId);
  }

  /** Rejects an incoming request or cancels an outgoing one. */
  async removeRequest(userId: string, requestId: string): Promise<void> {
    const request = await this.deleteFriendship(userId, requestId, 'PENDING');
    if (!request) {
      throw new NotFoundException(REQUEST_NOT_FOUND_MESSAGE);
    }
    this.notifications.emitToUser(otherUserId(request, userId), 'friend:request-removed', {
      requestId,
    });
  }

  async removeFriend(userId: string, friendshipId: string): Promise<void> {
    const friendship = await this.deleteFriendship(userId, friendshipId, 'ACCEPTED');
    if (!friendship) {
      throw new NotFoundException('You are not friends with this player.');
    }
    this.notifications.emitToUser(otherUserId(friendship, userId), 'friend:removed', {
      friendshipId,
    });
  }

  private async createOrAcceptRequest(
    tx: Prisma.TransactionClient,
    senderId: string,
    receiverId: string,
  ): Promise<SavedRequest> {
    // Locking both players makes two crossing requests run one after the other,
    // so the second one finds the first and accepts it instead of adding a reverse pair.
    await tx.$queryRaw`
      SELECT id FROM users WHERE id IN (${senderId}, ${receiverId}) ORDER BY id FOR UPDATE`;

    const existing = await tx.friendship.findFirst({
      where: between(senderId, [receiverId]),
    });
    if (!existing) {
      const friendship = await tx.friendship.create({
        data: { senderId, receiverId },
        include: FRIENDSHIP_USERS_INCLUDE,
      });
      return { friendship, accepted: false };
    }
    if (existing.status === 'ACCEPTED') {
      throw new ConflictException('You are already friends.');
    }
    if (existing.senderId === senderId) {
      throw new ConflictException('Your friend request is already waiting.');
    }

    const friendship = await tx.friendship.update({
      where: { id: existing.id },
      data: { status: 'ACCEPTED' },
      include: FRIENDSHIP_USERS_INCLUDE,
    });
    return { friendship, accepted: true };
  }

  private async deleteFriendship(
    userId: string,
    id: string,
    status: FriendshipStatus,
  ): Promise<Friendship | null> {
    const friendship = await this.prisma.friendship.findFirst({
      where: { id, status, ...involving(userId) },
    });
    if (!friendship) {
      return null;
    }
    const { count } = await this.prisma.friendship.deleteMany({ where: { id, status } });
    return count === 1 ? friendship : null;
  }

  private findPendingRequests(where: Prisma.FriendshipWhereInput): Promise<FriendshipWithUsers[]> {
    return this.prisma.friendship.findMany({
      where: { ...where, status: 'PENDING' },
      include: FRIENDSHIP_USERS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async assertUserExists(userId: string): Promise<void> {
    const count = await this.prisma.user.count({ where: { id: userId } });
    if (count === 0) {
      throw new NotFoundException(PLAYER_NOT_FOUND_MESSAGE);
    }
  }

  /** Tells the player who sent the request, with the accepting player as their new friend. */
  private notifyAccepted(friendship: FriendshipWithUsers, accepterId: string): void {
    const senderId = otherUserId(friendship, accepterId);
    this.notifications.emitToUser(
      senderId,
      'friend:accepted',
      this.friendFor(friendship, senderId),
    );
  }

  private friendFor(friendship: FriendshipWithUsers, viewerId: string): Friend {
    const isOnline = this.presence.isOnline(otherUserId(friendship, viewerId));
    return toFriend(friendship, viewerId, isOnline);
  }
}

function between(userId: string, otherIds: string[]): Prisma.FriendshipWhereInput {
  return {
    OR: [
      { senderId: userId, receiverId: { in: otherIds } },
      { receiverId: userId, senderId: { in: otherIds } },
    ],
  };
}

function byOnlineThenName(first: Friend, second: Friend): number {
  if (first.isOnline !== second.isOnline) {
    return first.isOnline ? -1 : 1;
  }
  return first.user.username.localeCompare(second.user.username);
}

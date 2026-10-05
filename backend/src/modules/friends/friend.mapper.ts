import { Friendship, Prisma } from '@prisma/client';
import { PUBLIC_USER_SELECT, PublicUserRow, toPublicUser } from '../users/user.mapper';
import { Friend, FriendRequest, RelationInfo } from './friends.types';

export const WITH_FRIENDSHIP_USERS = {
  sender: { select: PUBLIC_USER_SELECT },
  receiver: { select: PUBLIC_USER_SELECT },
} satisfies Prisma.FriendshipInclude;

export type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
  include: typeof WITH_FRIENDSHIP_USERS;
}>;

type FriendshipPair = Pick<Friendship, 'senderId' | 'receiverId'>;
type FriendshipLink = Pick<Friendship, 'id' | 'senderId' | 'receiverId' | 'status'>;

export function otherUserId(friendship: FriendshipPair, viewerId: string): string {
  return friendship.senderId === viewerId ? friendship.receiverId : friendship.senderId;
}

function otherUser(friendship: FriendshipWithUsers, viewerId: string): PublicUserRow {
  return friendship.senderId === viewerId ? friendship.receiver : friendship.sender;
}

export function toFriend(
  friendship: FriendshipWithUsers,
  viewerId: string,
  isOnline: boolean,
): Friend {
  return {
    friendshipId: friendship.id,
    user: toPublicUser(otherUser(friendship, viewerId)),
    isOnline,
    since: friendship.createdAt,
  };
}

export function toFriendRequest(friendship: FriendshipWithUsers, viewerId: string): FriendRequest {
  return {
    id: friendship.id,
    user: toPublicUser(otherUser(friendship, viewerId)),
    createdAt: friendship.createdAt,
  };
}

export function relationTo(friendship: FriendshipLink | null, viewerId: string): RelationInfo {
  if (!friendship) {
    return { relation: 'NONE', friendshipId: null };
  }
  if (friendship.status === 'ACCEPTED') {
    return { relation: 'FRIEND', friendshipId: friendship.id };
  }
  const relation = friendship.senderId === viewerId ? 'REQUEST_SENT' : 'REQUEST_RECEIVED';
  return { relation, friendshipId: friendship.id };
}

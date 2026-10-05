import { PublicUser } from '../users/users.types';

export type FriendRelation = 'NONE' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

export interface Friend {
  friendshipId: string;
  user: PublicUser;
  isOnline: boolean;
  since: Date;
}

export interface FriendRequest {
  id: string;
  user: PublicUser;
  createdAt: Date;
}

export interface FriendRequests {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface UserSearchResult {
  user: PublicUser;
  relation: FriendRelation;
  friendshipId: string | null;
}

export interface FriendRequestOutcome {
  status: 'SENT' | 'ACCEPTED';
  request: FriendRequest | null;
  friend: Friend | null;
}

export interface RelationInfo {
  relation: FriendRelation;
  friendshipId: string | null;
}

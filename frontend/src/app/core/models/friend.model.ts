import { PublicUser } from './user.model';

export type FriendRelation = 'NONE' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';

export interface Friend {
  friendshipId: string;
  user: PublicUser;
  isOnline: boolean;
  since: string;
}

export interface FriendRequest {
  id: string;
  user: PublicUser;
  createdAt: string;
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

export interface SendFriendRequest {
  userId: string;
}

export interface FriendRequestOutcome {
  status: 'SENT' | 'ACCEPTED';
  request: FriendRequest | null;
  friend: Friend | null;
}

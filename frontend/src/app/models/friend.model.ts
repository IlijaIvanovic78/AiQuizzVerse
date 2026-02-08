export type FriendshipStatus = 'none' | 'pending' | 'accepted';

export interface Friend {
  id: string; // friendshipId — used as entity ID and for remove/accept
  userId: string; // the friend's user ID
  username: string;
  email: string;
  avatarUrl: string | null;
  status: 'online' | 'offline';
  since: string; // ISO date string - when friendship was accepted
}

export interface FriendRequest {
  id: string; // Friendship ID
  from: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: string; // ISO date string
}

export interface SentFriendRequest {
  id: string; // Friendship ID
  to: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  createdAt: string; // ISO date string
}

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  friendshipStatus: FriendshipStatus;
}

export interface FriendshipResponse {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
}

// Socket event payloads
export interface FriendOnlineEvent {
  userId: string;
  timestamp: string;
}

export interface FriendOfflineEvent {
  userId: string;
  timestamp: string;
}

export interface FriendRequestSentEvent {
  friendshipId: string;
  from: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  timestamp: string;
}

export interface FriendRequestAcceptedEvent {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  timestamp: string;
}

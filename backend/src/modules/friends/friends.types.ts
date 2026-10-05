import { PublicUser } from '../users/users.types';

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

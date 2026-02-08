export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  xp: number;
  coins: number;
  level: number;
  friendsCount: number;
  twoFaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  username?: string;
  avatarUrl?: string;
}

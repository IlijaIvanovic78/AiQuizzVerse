export interface PublicUser {
  id: string;
  username: string;
  avatarKey: string | null;
  petKey: string | null;
  level: number;
}

export interface CurrentUser extends PublicUser {
  email: string;
  xp: number;
  coins: number;
  streak: number;
  longestStreak: number;
  streakFreezes: number;
  twoFaEnabled: boolean;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

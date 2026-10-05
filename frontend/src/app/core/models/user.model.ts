import { SabotageType } from './match.model';

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
  // Ink is free for everyone, so it is always here; the others come from the shop or a chest.
  sabotages: SabotageType[];
}

import { SabotageType } from '../matches/matches.types';

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
  /** INK plus every sabotage the user owns, for the party sabotage bar. */
  sabotages: SabotageType[];
}

export interface NewUser {
  email: string;
  username: string;
  passwordHash: string;
}

import { Prisma } from '@prisma/client';
import {
  PUBLIC_USER_SELECT,
  shownStreak,
  STREAK_FREEZES_SELECT,
  toPublicUser,
} from '../users/user.mapper';
import { ProfileUser } from './profile.types';

export const PROFILE_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  streak: true,
  longestStreak: true,
  lastPlayedOn: true,
  createdAt: true,
  boosts: STREAK_FREEZES_SELECT,
} satisfies Prisma.UserSelect;

export type ProfileUserRow = Prisma.UserGetPayload<{ select: typeof PROFILE_USER_SELECT }>;

export function toProfileUser(user: ProfileUserRow): ProfileUser {
  return {
    ...toPublicUser(user),
    xp: user.xp,
    streak: shownStreak(user),
    longestStreak: user.longestStreak,
    memberSince: user.createdAt,
  };
}

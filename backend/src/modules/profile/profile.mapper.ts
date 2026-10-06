import { Prisma } from '@prisma/client';
import { utcToday } from '../../common/utils/dates';
import { displayedStreak } from '../progression/progression.rules';
import {
  PUBLIC_USER_SELECT,
  STREAK_SELECT,
  streakStateOf,
  toPublicUser,
} from '../users/user.mapper';
import { ProfileUser } from './profile.types';

export const PROFILE_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  ...STREAK_SELECT,
  longestStreak: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type ProfileUserRow = Prisma.UserGetPayload<{ select: typeof PROFILE_USER_SELECT }>;

export function toProfileUser(user: ProfileUserRow): ProfileUser {
  return {
    ...toPublicUser(user),
    xp: user.xp,
    streak: displayedStreak(streakStateOf(user), utcToday()),
    longestStreak: user.longestStreak,
    memberSince: user.createdAt,
  };
}

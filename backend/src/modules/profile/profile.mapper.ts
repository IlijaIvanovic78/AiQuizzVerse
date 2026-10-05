import { Prisma } from '@prisma/client';
import { utcToday } from '../../common/utils/dates';
import { displayedStreak } from '../progression/progression.rules';
import { PUBLIC_USER_SELECT, toPublicUser } from '../users/user.mapper';
import { ProfileUser } from './profile.types';

export const PROFILE_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  streak: true,
  longestStreak: true,
  lastPlayedOn: true,
  createdAt: true,
  boosts: { where: { type: 'STREAK_FREEZE' }, select: { quantity: true } },
} satisfies Prisma.UserSelect;

export type ProfileUserRow = Prisma.UserGetPayload<{ select: typeof PROFILE_USER_SELECT }>;

export function toProfileUser(user: ProfileUserRow): ProfileUser {
  const streakFreezes = user.boosts[0]?.quantity ?? 0;
  const streakState = { streak: user.streak, lastPlayedOn: user.lastPlayedOn, streakFreezes };
  return {
    ...toPublicUser(user),
    xp: user.xp,
    streak: displayedStreak(streakState, utcToday()),
    longestStreak: user.longestStreak,
    memberSince: user.createdAt,
  };
}

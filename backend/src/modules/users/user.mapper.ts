import { Prisma, User } from '@prisma/client';
import { utcToday } from '../../common/utils/dates';
import { displayedStreak, levelForXp, levelProgress } from '../progression/progression.rules';
import { CurrentUser, PublicUser } from './users.types';

export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  avatarKey: true,
  petKey: true,
  xp: true,
} satisfies Prisma.UserSelect;

export type PublicUserRow = Prisma.UserGetPayload<{ select: typeof PUBLIC_USER_SELECT }>;

export function toPublicUser(user: PublicUserRow): PublicUser {
  return {
    id: user.id,
    username: user.username,
    avatarKey: user.avatarKey,
    petKey: user.petKey,
    level: levelForXp(user.xp),
  };
}

export function toCurrentUser(user: User, streakFreezes: number): CurrentUser {
  const { xpIntoLevel, xpForNextLevel } = levelProgress(user.xp);
  const streakState = { streak: user.streak, lastPlayedOn: user.lastPlayedOn, streakFreezes };
  return {
    ...toPublicUser(user),
    email: user.email,
    xp: user.xp,
    coins: user.coins,
    streak: displayedStreak(streakState, utcToday()),
    longestStreak: user.longestStreak,
    streakFreezes,
    twoFaEnabled: user.twoFaEnabled,
    xpIntoLevel,
    xpForNextLevel,
  };
}

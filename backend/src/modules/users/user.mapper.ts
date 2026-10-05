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

/** The user's streak freeze boost, loaded together with the user as `boosts`. */
export const STREAK_FREEZES_SELECT = {
  where: { type: 'STREAK_FREEZE' },
  select: { quantity: true },
} satisfies Prisma.User$boostsArgs;

interface WithStreakFreezes {
  boosts: { quantity: number }[];
}

type StreakRow = Pick<User, 'streak' | 'lastPlayedOn'> & WithStreakFreezes;

export function toPublicUser(user: PublicUserRow): PublicUser {
  return {
    id: user.id,
    username: user.username,
    avatarKey: user.avatarKey,
    petKey: user.petKey,
    level: levelForXp(user.xp),
  };
}

export function toCurrentUser(user: User & WithStreakFreezes): CurrentUser {
  const { xpIntoLevel, xpForNextLevel } = levelProgress(user.xp);
  return {
    ...toPublicUser(user),
    email: user.email,
    xp: user.xp,
    coins: user.coins,
    streak: shownStreak(user),
    longestStreak: user.longestStreak,
    streakFreezes: streakFreezesOf(user),
    twoFaEnabled: user.twoFaEnabled,
    xpIntoLevel,
    xpForNextLevel,
  };
}

/** displayedStreak for a user row loaded with STREAK_FREEZES_SELECT. */
export function shownStreak(user: StreakRow): number {
  const streakState = {
    streak: user.streak,
    lastPlayedOn: user.lastPlayedOn,
    streakFreezes: streakFreezesOf(user),
  };
  return displayedStreak(streakState, utcToday());
}

function streakFreezesOf(user: WithStreakFreezes): number {
  return user.boosts[0]?.quantity ?? 0;
}

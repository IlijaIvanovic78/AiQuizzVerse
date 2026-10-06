import { Prisma } from '@prisma/client';
import { utcToday } from '../../common/utils/dates';
import { displayedStreak, levelForXp, levelProgress } from '../progression/progression.rules';
import { StreakState } from '../progression/progression.types';
import { ownedSabotages, SABOTAGE_ITEMS_SELECT } from '../shop/sabotage-items';
import { CurrentUser, PublicUser } from './users.types';

export const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  avatarKey: true,
  petKey: true,
  xp: true,
} satisfies Prisma.UserSelect;

export type PublicUserRow = Prisma.UserGetPayload<{ select: typeof PUBLIC_USER_SELECT }>;

/** Every boost row of the user. There is one row per boost type, so this stays small. */
const USER_BOOSTS = { select: { type: true, quantity: true } } satisfies Prisma.User$boostsArgs;

/** What streakStateOf needs from a user row. */
export const STREAK_SELECT = {
  streak: true,
  lastPlayedOn: true,
  boosts: USER_BOOSTS,
} satisfies Prisma.UserSelect;

type StreakRow = Prisma.UserGetPayload<{ select: typeof STREAK_SELECT }>;

export const CURRENT_USER_INCLUDE = {
  boosts: USER_BOOSTS,
  items: SABOTAGE_ITEMS_SELECT,
} satisfies Prisma.UserInclude;

type CurrentUserRow = Prisma.UserGetPayload<{ include: typeof CURRENT_USER_INCLUDE }>;

export function toPublicUser(user: PublicUserRow): PublicUser {
  return {
    id: user.id,
    username: user.username,
    avatarKey: user.avatarKey,
    petKey: user.petKey,
    level: levelForXp(user.xp),
  };
}

export function toCurrentUser(user: CurrentUserRow): CurrentUser {
  const { xpIntoLevel, xpForNextLevel } = levelProgress(user.xp);
  const streakState = streakStateOf(user);
  return {
    ...toPublicUser(user),
    email: user.email,
    xp: user.xp,
    coins: user.coins,
    streak: displayedStreak(streakState, utcToday()),
    longestStreak: user.longestStreak,
    streakFreezes: streakState.streakFreezes,
    twoFaEnabled: user.twoFaEnabled,
    xpIntoLevel,
    xpForNextLevel,
    sabotages: ownedSabotages(user.items),
  };
}

export function streakStateOf(user: StreakRow): StreakState {
  const streakFreeze = user.boosts.find((boost) => boost.type === 'STREAK_FREEZE');
  return {
    streak: user.streak,
    lastPlayedOn: user.lastPlayedOn,
    streakFreezes: streakFreeze?.quantity ?? 0,
  };
}

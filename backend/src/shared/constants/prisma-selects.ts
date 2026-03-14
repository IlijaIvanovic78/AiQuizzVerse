/** Standard public user fields for API responses (excludes sensitive data) */
export const USER_PUBLIC_SELECT = {
  id: true,
  username: true,
  email: true,
  avatarUrl: true,
  level: true,
} as const;

/** Extended public user fields including XP */
export const USER_PUBLIC_WITH_XP_SELECT = {
  ...USER_PUBLIC_SELECT,
  xp: true,
} as const;

/** Minimal user fields for match/game contexts */
export const USER_MATCH_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
} as const;

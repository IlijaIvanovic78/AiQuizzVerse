export interface User {
  id: string;
  email: string;
  username: string;
  xp: number;
  coins: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastPlayedAt: string | null;
  avatarUrl: string | null;
  petUrl: string | null;
  twoFaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TwoFARequiredResponse {
  is2FARequired: true;
  userId: string;
}

export interface Login2FARequest {
  userId: string;
  token: string;
}

export interface Enable2FAResponse {
  secret: string;
  qrCode: string;
}

export interface Verify2FARequest {
  token: string;
}

export interface UsernameAvailability {
  available: boolean;
}

export type AuthLoginResult = LoginResponse | TwoFARequiredResponse;

export function is2FARequired(result: AuthLoginResult): result is TwoFARequiredResponse {
  return 'is2FARequired' in result && result.is2FARequired === true;
}

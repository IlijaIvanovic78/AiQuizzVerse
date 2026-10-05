import { CurrentUser } from '../users/users.types';

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}

export interface TwoFactorTokenPayload {
  sub: string;
  type: '2fa';
}

export type TokenPayload = AccessTokenPayload | RefreshTokenPayload | TwoFactorTokenPayload;

/** What every Passport strategy puts on request.user. */
export interface AuthUser {
  userId: string;
}

export interface AuthResponse {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
}

export interface TwoFactorChallenge {
  twoFactorRequired: true;
  twoFactorToken: string;
}

export type LoginResult = AuthResponse | TwoFactorChallenge;

export interface TwoFactorSetup {
  qrCodeDataUrl: string;
  secret: string;
}

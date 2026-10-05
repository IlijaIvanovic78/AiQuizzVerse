import { CurrentUser } from './user.model';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: CurrentUser;
}

export interface TwoFactorChallenge {
  twoFactorRequired: true;
  twoFactorToken: string;
}

export type LoginResult = AuthResponse | TwoFactorChallenge;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface TwoFactorLoginRequest {
  twoFactorToken: string;
  code: string;
}

export interface TwoFactorSetup {
  qrCodeDataUrl: string;
  secret: string;
}

export interface UsernameAvailability {
  available: boolean;
}

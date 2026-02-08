import { User } from '../../core/models';

/**
 * Auth State Interface
 * Manages authentication state including user data, tokens, and UI state.
 */
export interface AuthState {
  /** Currently authenticated user (null if not logged in) */
  user: User | null;

  /** JWT access token (short-lived, 15 minutes) */
  accessToken: string | null;

  /** JWT refresh token (long-lived, 7 days) */
  refreshToken: string | null;

  /** Whether the user is authenticated */
  isAuthenticated: boolean;

  /** Whether 2FA verification is required to complete login */
  is2FARequired: boolean;

  /** User ID stored temporarily during 2FA flow */
  pending2FAUserId: string | null;

  /** Loading state for async operations (login, register, 2FA) */
  loading: boolean;

  /** Error message from failed auth operations */
  error: string | null;
}

/**
 * Initial state for Auth Store
 */
export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  is2FARequired: false,
  pending2FAUserId: null,
  loading: false,
  error: null,
};

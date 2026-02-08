import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

/**
 * Auth Reducer
 * Handles all authentication state transitions.
 */
export const authReducer = createReducer(
  initialAuthState,

  // ==================== REGISTER ====================
  on(AuthActions.register, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.registerSuccess, (state, { response }): AuthState => ({
    ...state,
    user: response.user,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    isAuthenticated: true,
    loading: false,
    error: null,
  })),

  on(AuthActions.registerFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),

  // ==================== LOGIN ====================
  on(AuthActions.login, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
    is2FARequired: false,
    pending2FAUserId: null,
  })),

  on(AuthActions.loginSuccess, (state, { response }): AuthState => ({
    ...state,
    user: response.user,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    isAuthenticated: true,
    is2FARequired: false,
    pending2FAUserId: null,
    loading: false,
    error: null,
  })),

  on(AuthActions.login2FARequired, (state, { response }): AuthState => ({
    ...state,
    is2FARequired: true,
    pending2FAUserId: response.userId,
    loading: false,
    error: null,
  })),

  on(AuthActions.loginFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),

  // ==================== 2FA LOGIN ====================
  on(AuthActions.login2FA, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.login2FASuccess, (state, { response }): AuthState => ({
    ...state,
    user: response.user,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    isAuthenticated: true,
    is2FARequired: false,
    pending2FAUserId: null,
    loading: false,
    error: null,
  })),

  on(AuthActions.login2FAFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),

  // ==================== REFRESH TOKEN ====================
  on(AuthActions.refreshToken, (state): AuthState => ({
    ...state,
    // Don't set loading=true for refresh to avoid UI flicker
  })),

  on(AuthActions.refreshTokenSuccess, (state, { accessToken, refreshToken }): AuthState => ({
    ...state,
    accessToken,
    refreshToken,
  })),

  on(AuthActions.refreshTokenFailure, (state): AuthState => ({
    ...initialAuthState, // Reset to initial state on refresh failure
  })),

  // ==================== LOGOUT ====================
  on(AuthActions.logout, (): AuthState => ({
    ...initialAuthState,
  })),

  on(AuthActions.logoutSuccess, (): AuthState => ({
    ...initialAuthState,
  })),

  // ==================== PROFILE ====================
  on(AuthActions.loadProfile, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loadProfileSuccess, (state, { user }): AuthState => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(AuthActions.loadProfileFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),

  // ==================== 2FA SETUP ====================
  on(AuthActions.enable2FA, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.enable2FASuccess, (state): AuthState => ({
    ...state,
    loading: false,
    error: null,
  })),

  on(AuthActions.enable2FAFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.verify2FA, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.verify2FASuccess, (state, { user }): AuthState => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(AuthActions.verify2FAFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),

  // ==================== UI ====================
  on(AuthActions.clearError, (state): AuthState => ({
    ...state,
    error: null,
  })),
);

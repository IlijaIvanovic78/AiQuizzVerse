import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

/**
 * Auth Selectors
 * Memoized selectors for accessing auth state slices.
 */

// Feature selector
export const selectAuthState = createFeatureSelector<AuthState>('auth');

// ==================== BASE SELECTORS ====================
export const selectUser = createSelector(selectAuthState, (state) => state.user);

export const selectAccessToken = createSelector(selectAuthState, (state) => state.accessToken);

export const selectRefreshToken = createSelector(selectAuthState, (state) => state.refreshToken);

export const selectIsAuthenticated = createSelector(selectAuthState, (state) => state.isAuthenticated);

export const selectIs2FARequired = createSelector(selectAuthState, (state) => state.is2FARequired);

export const selectPending2FAUserId = createSelector(selectAuthState, (state) => state.pending2FAUserId);

export const selectLoading = createSelector(selectAuthState, (state) => state.loading);

export const selectError = createSelector(selectAuthState, (state) => state.error);

// ==================== COMPUTED SELECTORS ====================

/**
 * User's display name (username or email)
 */
export const selectUserDisplayName = createSelector(selectUser, (user) => user?.username || user?.email || 'Guest');

/**
 * User initials for avatar (first 2 chars of username)
 */
export const selectUserInitials = createSelector(selectUser, (user) => {
  if (!user?.username) return '??';
  return user.username.substring(0, 2).toUpperCase();
});

/**
 * Whether user has 2FA enabled
 */
export const selectUser2FAEnabled = createSelector(selectUser, (user) => user?.twoFaEnabled || false);

/**
 * User ID
 */
export const selectUserId = createSelector(selectUser, (user) => user?.id || null);

/**
 * User email
 */
export const selectUserEmail = createSelector(selectUser, (user) => user?.email || null);

/**
 * User avatar URL
 */
export const selectUserAvatarUrl = createSelector(selectUser, (user) => user?.avatarUrl || null);

/**
 * User level
 */
export const selectUserLevel = createSelector(selectUser, (user) => user?.level || 1);

/**
 * User XP
 */
export const selectUserXP = createSelector(selectUser, (user) => user?.xp || 0);

/**
 * User coins
 */
export const selectUserCoins = createSelector(selectUser, (user) => user?.coins || 0);

/**
 * Whether auth state is ready (not loading and either authenticated or not)
 */
export const selectAuthReady = createSelector(
  selectLoading,
  selectIsAuthenticated,
  (loading, isAuthenticated) => !loading && (isAuthenticated !== undefined),
);

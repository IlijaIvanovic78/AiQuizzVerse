import { APP_INITIALIZER, Provider } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth/auth.actions';

/**
 * App initializer that restores auth state from localStorage on app bootstrap.
 * If valid tokens exist, loads user profile to restore session.
 */
export function initializeAuth(store: Store): () => Promise<void> {
  return () => {
    return new Promise((resolve) => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        // Restore tokens in store
        store.dispatch(
          AuthActions.refreshTokenSuccess({
            accessToken,
            refreshToken,
          }),
        );

        // Load user profile
        store.dispatch(AuthActions.loadProfile());
      }

      resolve();
    });
  };
}

/**
 * Provider for auth initialization
 */
export const authInitializerProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeAuth,
  deps: [Store],
  multi: true,
};

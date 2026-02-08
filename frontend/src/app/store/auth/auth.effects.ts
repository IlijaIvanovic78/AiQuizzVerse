import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap, of } from 'rxjs';
import { AuthService } from '../../core/services';
import { is2FARequired } from '../../core/models';
import { AuthActions } from './auth.actions';

/**
 * Auth Effects
 * Handles all side effects for authentication (API calls, navigation, storage).
 */
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  // ==================== REGISTER ====================
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ credentials }) =>
        this.authService.register(credentials).pipe(
          map((response) => AuthActions.registerSuccess({ response })),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: error.error?.message || 'Registration failed' })),
          ),
        ),
      ),
    ),
  );

  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(({ response }) => {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          // Navigate to dashboard
          this.router.navigate(['/dashboard']);
        }),
      ),
    { dispatch: false },
  );

  // ==================== LOGIN ====================
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((response) => {
            if (is2FARequired(response)) {
              return AuthActions.login2FARequired({ response });
            }
            return AuthActions.loginSuccess({ response });
          }),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.error?.message || 'Login failed' })),
          ),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ response }) => {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          // Navigate to dashboard
          this.router.navigate(['/dashboard']);
        }),
      ),
    { dispatch: false },
  );

  // ==================== 2FA LOGIN ====================
  login2FA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login2FA),
      switchMap(({ request }) =>
        this.authService.login2FA(request).pipe(
          map((response) => AuthActions.login2FASuccess({ response })),
          catchError((error) =>
            of(AuthActions.login2FAFailure({ error: error.error?.message || '2FA verification failed' })),
          ),
        ),
      ),
    ),
  );

  login2FASuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.login2FASuccess),
        tap(({ response }) => {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          // Navigate to dashboard
          this.router.navigate(['/dashboard']);
        }),
      ),
    { dispatch: false },
  );

  // ==================== LOGOUT ====================
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess())), // Always succeed logout locally
        ),
      ),
    ),
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          // Clear tokens from localStorage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Navigate to login
          this.router.navigate(['/auth/login']);
        }),
      ),
    { dispatch: false },
  );

  // ==================== PROFILE ====================
  loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadProfile),
      switchMap(() =>
        this.authService.getProfile().pipe(
          map((user) => AuthActions.loadProfileSuccess({ user })),
          catchError((error) =>
            of(AuthActions.loadProfileFailure({ error: error.error?.message || 'Failed to load profile' })),
          ),
        ),
      ),
    ),
  );

  // ==================== 2FA SETUP ====================
  enable2FA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.enable2FA),
      switchMap(() =>
        this.authService.enable2FA().pipe(
          map((response) => AuthActions.enable2FASuccess({ response })),
          catchError((error) =>
            of(AuthActions.enable2FAFailure({ error: error.error?.message || 'Failed to enable 2FA' })),
          ),
        ),
      ),
    ),
  );

  verify2FA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verify2FA),
      switchMap(({ request }) =>
        this.authService.verify2FA(request.code).pipe(
          map((user) => AuthActions.verify2FASuccess({ user })),
          catchError((error) =>
            of(AuthActions.verify2FAFailure({ error: error.error?.message || 'Failed to verify 2FA' })),
          ),
        ),
      ),
    ),
  );

  // ==================== REFRESH TOKEN (triggered from interceptor) ====================
  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(({ refreshToken }) =>
        this.authService.refreshToken(refreshToken).pipe(
          map((response) =>
            AuthActions.refreshTokenSuccess({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            }),
          ),
          catchError((error) =>
            of(AuthActions.refreshTokenFailure({ error: error.error?.message || 'Token refresh failed' })),
          ),
        ),
      ),
    ),
  );

  refreshTokenSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.refreshTokenSuccess),
        tap(({ accessToken, refreshToken }) => {
          // Update tokens in localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }),
      ),
    { dispatch: false },
  );
}

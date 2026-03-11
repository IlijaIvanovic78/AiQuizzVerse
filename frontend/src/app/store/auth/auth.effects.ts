import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap, of } from 'rxjs';
import { AuthService } from '../../core/services';
import { SocketService } from '../../services';
import { is2FARequired } from '../../core/models';
import { AuthActions } from './auth.actions';

/**
 * Auth Effects
 * Handles all side effects for authentication (API calls, navigation, storage).
 */
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
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
          // Connect WebSocket with access token
          this.socketService.connect(response.accessToken);
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
          // Connect WebSocket with access token
          this.socketService.connect(response.accessToken);
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
          // Connect WebSocket with access token
          this.socketService.connect(response.accessToken);
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
          // Disconnect WebSocket
          this.socketService.disconnect();
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

  // Connect socket after profile loaded (handles page refresh case)
  loadProfileSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loadProfileSuccess),
        tap(() => {
          const token = localStorage.getItem('accessToken');
          if (token && !this.socketService.isConnected()) {
            this.socketService.connect(token);
          }
        }),
      ),
    { dispatch: false },
  );

  // Clear tokens on profile load failure (invalid/expired token)
  loadProfileFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loadProfileFailure),
        tap(() => {
          this.socketService.disconnect();
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          this.router.navigate(['/auth/login']);
        }),
      ),
    { dispatch: false },
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
        this.authService.verify2FA(request.token).pipe(
          switchMap(() => [
            AuthActions.verify2FASuccess(),
            AuthActions.loadProfile(), // Reload profile to get updated twoFaEnabled
          ]),
          catchError((error) =>
            of(AuthActions.verify2FAFailure({ error: error.error?.message || 'Failed to verify 2FA' })),
          ),
        ),
      ),
    ),
  );

  // ==================== DISABLE 2FA ====================
  disable2FA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.disable2FA),
      switchMap(() =>
        this.authService.disable2FA().pipe(
          switchMap(() => [
            AuthActions.disable2FASuccess(),
            AuthActions.loadProfile(), // Reload profile to get updated twoFaEnabled
          ]),
          catchError((error) =>
            of(AuthActions.disable2FAFailure({ error: error.error?.message || 'Failed to disable 2FA' })),
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
            AuthActions.refreshTokenSuccess({ response }),
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
        tap(({ response }) => {
          // Update tokens in localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
        }),
      ),
    { dispatch: false },
  );
}

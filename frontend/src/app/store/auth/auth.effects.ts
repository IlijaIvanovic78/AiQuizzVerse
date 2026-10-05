import { Injectable, inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import {
  EMPTY,
  Observable,
  catchError,
  exhaustMap,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { AuthApiService } from '../../core/api/auth-api.service';
import { ProfileApiService } from '../../core/api/profile-api.service';
import { RETURN_URL_PARAM } from '../../core/auth/auth.constants';
import { readReturnUrl } from '../../core/auth/return-url';
import { TokenStorageService } from '../../core/auth/token-storage.service';
import { AuthResponse, LoginResult } from '../../core/models/auth.model';
import { CurrentUser } from '../../core/models/user.model';
import { ToastService } from '../../core/notifications/toast.service';
import { MatchSocketService } from '../../core/realtime/match-socket.service';
import { RealtimeSocketService } from '../../core/realtime/realtime-socket.service';
import { MatchSocketActions } from '../match/match-socket.actions';
import { AuthActions } from './auth.actions';
import { authFeature } from './auth.reducer';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly authApi = inject(AuthApiService);
  private readonly profileApi = inject(ProfileApiService);
  private readonly tokens = inject(TokenStorageService);
  private readonly realtimeSocket = inject(RealtimeSocketService);
  private readonly matchSocket = inject(MatchSocketService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials }) =>
        this.authApi.login(credentials).pipe(
          map((result) => this.handleLoginResult(result)),
          catchError((error: unknown) => of(this.signInFailed(error))),
        ),
      ),
    ),
  );

  readonly submitTwoFactorCode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.submitTwoFactorCode),
      withLatestFrom(this.store.select(authFeature.selectTwoFactorToken)),
      exhaustMap(([{ code }, twoFactorToken]) => this.loginWithCode(twoFactorToken, code)),
    ),
  );

  readonly register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ request }) =>
        this.authApi.register(request).pipe(
          map((response) => this.completeSignIn(response)),
          catchError((error: unknown) => of(this.signInFailed(error))),
        ),
      ),
    ),
  );

  readonly enterApp$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signedIn),
        tap(({ user }) => void this.router.navigateByUrl(this.landingUrl(user))),
      ),
    { dispatch: false },
  );

  readonly connectRealtime$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signedIn, AuthActions.sessionRestored),
        tap(() => this.realtimeSocket.connect()),
      ),
    { dispatch: false },
  );

  readonly logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        exhaustMap(() => this.authApi.logout().pipe(catchError(() => of(null)))),
        tap(() => {
          this.closeSession();
          void this.router.navigateByUrl('/login');
        }),
      ),
    { dispatch: false },
  );

  readonly sessionExpired$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.sessionExpired),
        tap(() => {
          this.closeSession();
          this.toast.info('Your session ended. Please log in again.');
          void this.router.navigateByUrl('/login');
        }),
      ),
    { dispatch: false },
  );

  // Rewards change XP, coins and streak on the server, so the hero is reloaded after a match.
  readonly refreshUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshUser, MatchSocketActions.finished),
      switchMap(() =>
        this.authApi.me().pipe(
          map((user) => AuthActions.userRefreshed({ user })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  readonly changeUsername$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.changeUsername),
      exhaustMap(({ username }) =>
        this.profileApi.updateMe({ username }).pipe(
          map((user) => AuthActions.usernameChanged({ user })),
          catchError((error: unknown) => of(this.settingsFailed(error))),
        ),
      ),
    ),
  );

  readonly enableTwoFactor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.enableTwoFactor),
      exhaustMap(({ code }) =>
        this.authApi.enableTwoFactor(code).pipe(
          map((user) => AuthActions.twoFactorChanged({ user })),
          catchError((error: unknown) => of(this.settingsFailed(error))),
        ),
      ),
    ),
  );

  readonly disableTwoFactor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.disableTwoFactor),
      exhaustMap(({ code }) =>
        this.authApi.disableTwoFactor(code).pipe(
          map((user) => AuthActions.twoFactorChanged({ user })),
          catchError((error: unknown) => of(this.settingsFailed(error))),
        ),
      ),
    ),
  );

  readonly announceSettings$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.usernameChanged, AuthActions.twoFactorChanged),
        tap(() => this.toast.success('Settings saved.')),
      ),
    { dispatch: false },
  );

  readonly showSettingsError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.settingsFailed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private loginWithCode(twoFactorToken: string | null, code: string): Observable<Action> {
    if (!twoFactorToken) {
      return of(AuthActions.twoFactorCancelled());
    }
    return this.authApi.loginWithTwoFactor({ twoFactorToken, code }).pipe(
      map((response) => this.completeSignIn(response)),
      catchError((error: unknown) => of(this.signInFailed(error))),
    );
  }

  // A player who opened a share link while logged out goes back to it after signing in.
  // A new player picks a hero first, so the link travels along to the welcome page.
  private landingUrl(user: CurrentUser): UrlTree {
    const returnUrl = readReturnUrl(this.router);
    if (!user.avatarKey) {
      return this.router.createUrlTree(['/welcome'], {
        queryParams: { [RETURN_URL_PARAM]: returnUrl },
      });
    }
    return this.router.parseUrl(returnUrl ?? '/home');
  }

  private handleLoginResult(result: LoginResult): Action {
    if ('twoFactorRequired' in result) {
      return AuthActions.twoFactorRequired({ twoFactorToken: result.twoFactorToken });
    }
    return this.completeSignIn(result);
  }

  private completeSignIn(response: AuthResponse): Action {
    this.tokens.save(response);
    return AuthActions.signedIn({ user: response.user });
  }

  private closeSession(): void {
    this.tokens.clear();
    this.realtimeSocket.disconnect();
    this.matchSocket.disconnect();
  }

  private signInFailed(error: unknown) {
    return AuthActions.signInFailed({ error: readErrorMessage(error) });
  }

  private settingsFailed(error: unknown) {
    return AuthActions.settingsFailed({ error: readErrorMessage(error) });
  }
}

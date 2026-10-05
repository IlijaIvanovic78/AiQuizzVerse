import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { EMPTY, catchError, exhaustMap, filter, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { AuthApiService } from '../../core/api/auth-api.service';
import { ChestsApiService } from '../../core/api/chests-api.service';
import { ToastService } from '../../core/notifications/toast.service';
import { AuthActions } from '../auth/auth.actions';
import { ChestsActions } from './chests.actions';

@Injectable()
export class ChestsEffects {
  private readonly actions$ = inject(Actions);
  private readonly chestsApi = inject(ChestsApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // The top bar shows how many chests wait to be opened, so they load right after signing in.
  readonly loadAfterSignIn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signedIn, AuthActions.sessionRestored),
      map(() => ChestsActions.load()),
    ),
  );

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChestsActions.load),
      switchMap(() =>
        this.chestsApi.list().pipe(
          map(({ unopened, recent }) => ChestsActions.loaded({ unopened, recent })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly loadOdds$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChestsActions.loadOdds),
      switchMap(() =>
        this.chestsApi.odds().pipe(
          map((odds) => ChestsActions.oddsLoaded({ odds })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  // A chest that fails to open may have been opened in another tab, so the list loads again.
  readonly open$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChestsActions.open),
      exhaustMap(({ chestId }) =>
        this.chestsApi.open(chestId).pipe(
          map(({ chest, reward, coins }) => ChestsActions.opened({ chest, reward, coins })),
          catchError((error: unknown) => of(this.failed(error), ChestsActions.load())),
        ),
      ),
    ),
  );

  // A streak freeze is part of the hero, not of the coin balance, so the hero is reloaded.
  readonly reloadUserAfterFreeze$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChestsActions.opened),
      filter(({ reward }) => reward.boosts.some((boost) => boost.type === 'STREAK_FREEZE')),
      switchMap(() =>
        this.authApi.me().pipe(
          map((user) => AuthActions.userRefreshed({ user })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  readonly visitTreasureRoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ChestsActions.visitTreasureRoom),
        tap(() => void this.router.navigateByUrl('/chests')),
      ),
    { dispatch: false },
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ChestsActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private failed(error: unknown): Action {
    return ChestsActions.failed({ error: readErrorMessage(error) });
  }
}

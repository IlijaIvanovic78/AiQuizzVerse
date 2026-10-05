import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { LeaderboardApiService } from '../../core/api/leaderboard-api.service';
import { ToastService } from '../../core/notifications/toast.service';
import { LeaderboardActions } from './leaderboard.actions';

@Injectable()
export class LeaderboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly leaderboardApi = inject(LeaderboardApiService);
  private readonly toast = inject(ToastService);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeaderboardActions.load),
      switchMap(({ scope }) =>
        this.leaderboardApi.get(scope).pipe(
          map((leaderboard) => LeaderboardActions.loaded({ leaderboard })),
          catchError((error: unknown) =>
            of(LeaderboardActions.failed({ error: readErrorMessage(error) })),
          ),
        ),
      ),
    ),
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LeaderboardActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );
}

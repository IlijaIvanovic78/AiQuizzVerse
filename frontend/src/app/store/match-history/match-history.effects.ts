import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { MatchesApiService } from '../../core/api/matches-api.service';
import { ToastService } from '../../core/notifications/toast.service';
import { MatchHistoryActions } from './match-history.actions';

@Injectable()
export class MatchHistoryEffects {
  private readonly actions$ = inject(Actions);
  private readonly matchesApi = inject(MatchesApiService);
  private readonly toast = inject(ToastService);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchHistoryActions.load),
      switchMap(() =>
        this.matchesApi.history().pipe(
          map((entries) => MatchHistoryActions.loaded({ entries })),
          catchError((error: unknown) =>
            of(MatchHistoryActions.failed({ error: readErrorMessage(error) })),
          ),
        ),
      ),
    ),
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchHistoryActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );
}

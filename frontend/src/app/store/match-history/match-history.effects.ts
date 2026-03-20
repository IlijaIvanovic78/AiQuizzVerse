import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { GameApiService } from '../../services/game-api.service';
import * as MatchHistoryActions from './match-history.actions';

@Injectable()
export class MatchHistoryEffects {
  private actions$ = inject(Actions);
  private gameApi = inject(GameApiService);

  loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchHistoryActions.loadMatchHistory),
      switchMap(() =>
        this.gameApi.getHistory().pipe(
          map((matches) => MatchHistoryActions.loadMatchHistorySuccess({ matches })),
          catchError((err) =>
            of(MatchHistoryActions.loadMatchHistoryFailure({ error: err?.error?.message || 'Failed to load match history' })),
          ),
        ),
      ),
    ),
  );
}

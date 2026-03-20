import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { LeaderboardApiService } from '../../services/leaderboard-api.service';
import * as LeaderboardActions from './leaderboard.actions';

@Injectable()
export class LeaderboardEffects {
  private actions$ = inject(Actions);
  private leaderboardApi = inject(LeaderboardApiService);

  loadGlobal$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeaderboardActions.loadGlobalLeaderboard),
      switchMap(() =>
        this.leaderboardApi.getGlobalLeaderboard().pipe(
          map((entries) => LeaderboardActions.loadGlobalLeaderboardSuccess({ entries })),
          catchError((err) =>
            of(LeaderboardActions.loadGlobalLeaderboardFailure({ error: err?.error?.message || 'Failed to load leaderboard' })),
          ),
        ),
      ),
    ),
  );

  loadFriends$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeaderboardActions.loadFriendsLeaderboard),
      switchMap(() =>
        this.leaderboardApi.getFriendsLeaderboard().pipe(
          map((entries) => LeaderboardActions.loadFriendsLeaderboardSuccess({ entries })),
          catchError((err) =>
            of(LeaderboardActions.loadFriendsLeaderboardFailure({ error: err?.error?.message || 'Failed to load leaderboard' })),
          ),
        ),
      ),
    ),
  );
}

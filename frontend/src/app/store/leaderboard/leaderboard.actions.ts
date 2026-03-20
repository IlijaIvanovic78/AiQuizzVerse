import { createAction, props } from '@ngrx/store';
import { LeaderboardEntry } from '../../models/leaderboard.model';

// Global leaderboard
export const loadGlobalLeaderboard = createAction('[Leaderboard] Load Global');
export const loadGlobalLeaderboardSuccess = createAction(
  '[Leaderboard] Load Global Success',
  props<{ entries: LeaderboardEntry[] }>(),
);
export const loadGlobalLeaderboardFailure = createAction(
  '[Leaderboard] Load Global Failure',
  props<{ error: string }>(),
);

// Friends leaderboard
export const loadFriendsLeaderboard = createAction('[Leaderboard] Load Friends');
export const loadFriendsLeaderboardSuccess = createAction(
  '[Leaderboard] Load Friends Success',
  props<{ entries: LeaderboardEntry[] }>(),
);
export const loadFriendsLeaderboardFailure = createAction(
  '[Leaderboard] Load Friends Failure',
  props<{ error: string }>(),
);

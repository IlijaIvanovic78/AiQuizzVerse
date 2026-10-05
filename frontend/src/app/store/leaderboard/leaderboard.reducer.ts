import { createFeature, createReducer, on } from '@ngrx/store';
import {
  LeaderboardEntry,
  LeaderboardMe,
  LeaderboardScope,
} from '../../core/models/leaderboard.model';
import { LeaderboardActions } from './leaderboard.actions';

interface LeaderboardState {
  scope: LeaderboardScope;
  entries: LeaderboardEntry[];
  me: LeaderboardMe | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  scope: 'friends',
  entries: [],
  me: null,
  loading: false,
  error: null,
};

export const leaderboardFeature = createFeature({
  name: 'leaderboard',
  reducer: createReducer(
    initialState,
    on(
      LeaderboardActions.load,
      (state, { scope }): LeaderboardState => ({ ...state, scope, loading: true, error: null }),
    ),
    on(
      LeaderboardActions.loaded,
      (state, { leaderboard }): LeaderboardState => ({
        ...state,
        entries: leaderboard.entries,
        me: leaderboard.me,
        loading: false,
      }),
    ),
    on(
      LeaderboardActions.failed,
      (state, { error }): LeaderboardState => ({ ...state, loading: false, error }),
    ),
  ),
});

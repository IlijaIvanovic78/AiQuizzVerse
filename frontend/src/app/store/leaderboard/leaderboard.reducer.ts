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
  loaded: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  scope: 'friends',
  entries: [],
  me: null,
  loaded: false,
  error: null,
};

export const leaderboardFeature = createFeature({
  name: 'leaderboard',
  reducer: createReducer(
    initialState,
    on(LeaderboardActions.load, (state, { scope }) => startLoading(state, scope)),
    on(
      LeaderboardActions.loaded,
      (state, { leaderboard }): LeaderboardState => ({
        ...state,
        entries: leaderboard.entries,
        me: leaderboard.me,
        loaded: true,
      }),
    ),
    on(LeaderboardActions.failed, (state, { error }): LeaderboardState => ({ ...state, error })),
  ),
});

// Switching between friends and global must not show the other board's rows while loading.
function startLoading(state: LeaderboardState, scope: LeaderboardScope): LeaderboardState {
  if (scope !== state.scope) {
    return { ...initialState, scope };
  }
  return { ...state, error: null };
}

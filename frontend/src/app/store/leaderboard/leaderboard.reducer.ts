import { createReducer, on } from '@ngrx/store';
import { initialLeaderboardState } from './leaderboard.state';
import * as LeaderboardActions from './leaderboard.actions';

export const leaderboardReducer = createReducer(
  initialLeaderboardState,

  // Global
  on(LeaderboardActions.loadGlobalLeaderboard, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(LeaderboardActions.loadGlobalLeaderboardSuccess, (state, { entries }) => ({
    ...state,
    globalRanking: entries,
    loading: false,
  })),
  on(LeaderboardActions.loadGlobalLeaderboardFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Friends
  on(LeaderboardActions.loadFriendsLeaderboard, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(LeaderboardActions.loadFriendsLeaderboardSuccess, (state, { entries }) => ({
    ...state,
    friendsRanking: entries,
    loading: false,
  })),
  on(LeaderboardActions.loadFriendsLeaderboardFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);

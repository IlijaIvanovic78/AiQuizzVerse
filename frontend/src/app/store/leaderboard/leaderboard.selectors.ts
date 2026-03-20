import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LeaderboardState } from './leaderboard.state';

export const selectLeaderboardState = createFeatureSelector<LeaderboardState>('leaderboard');

export const selectGlobalRanking = createSelector(selectLeaderboardState, (s) => s.globalRanking);
export const selectFriendsRanking = createSelector(selectLeaderboardState, (s) => s.friendsRanking);
export const selectLeaderboardLoading = createSelector(selectLeaderboardState, (s) => s.loading);
export const selectLeaderboardError = createSelector(selectLeaderboardState, (s) => s.error);

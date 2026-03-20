import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MatchHistoryState } from './match-history.state';

export const selectMatchHistoryState = createFeatureSelector<MatchHistoryState>('matchHistory');

export const selectMatchHistoryEntries = createSelector(selectMatchHistoryState, (s) => s.matches);
export const selectMatchHistoryLoading = createSelector(selectMatchHistoryState, (s) => s.loading);
export const selectMatchHistoryError = createSelector(selectMatchHistoryState, (s) => s.error);

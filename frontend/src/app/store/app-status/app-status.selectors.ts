import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppStatusState } from './app-status.state';

export const selectAppStatusState = createFeatureSelector<AppStatusState>('appStatus');

export const selectApiStatus = createSelector(
  selectAppStatusState,
  (state) => state.apiStatus
);

export const selectServerTime = createSelector(
  selectAppStatusState,
  (state) => state.serverTime
);

export const selectError = createSelector(
  selectAppStatusState,
  (state) => state.error
);

export const selectIsLoading = createSelector(
  selectApiStatus,
  (status) => status === 'loading'
);

export const selectIsOk = createSelector(
  selectApiStatus,
  (status) => status === 'ok'
);

export const selectIsError = createSelector(
  selectApiStatus,
  (status) => status === 'error'
);

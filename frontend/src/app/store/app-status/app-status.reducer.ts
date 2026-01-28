import { createReducer, on } from '@ngrx/store';
import { AppStatusState, initialAppStatusState } from './app-status.state';
import * as AppStatusActions from './app-status.actions';

export const appStatusReducer = createReducer(
  initialAppStatusState,
  on(AppStatusActions.loadHealth, (state): AppStatusState => ({
    ...state,
    apiStatus: 'loading',
    error: undefined,
  })),
  on(AppStatusActions.loadHealthSuccess, (state, { serverTime }): AppStatusState => ({
    ...state,
    apiStatus: 'ok',
    serverTime,
    error: undefined,
  })),
  on(AppStatusActions.loadHealthFailure, (state, { error }): AppStatusState => ({
    ...state,
    apiStatus: 'error',
    error,
  }))
);

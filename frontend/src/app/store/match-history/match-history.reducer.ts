import { createReducer, on } from '@ngrx/store';
import { initialMatchHistoryState } from './match-history.state';
import * as MatchHistoryActions from './match-history.actions';

export const matchHistoryReducer = createReducer(
  initialMatchHistoryState,

  on(MatchHistoryActions.loadMatchHistory, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(MatchHistoryActions.loadMatchHistorySuccess, (state, { matches }) => ({
    ...state,
    matches,
    loading: false,
  })),
  on(MatchHistoryActions.loadMatchHistoryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);

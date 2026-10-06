import { createFeature, createReducer, on } from '@ngrx/store';
import { MatchHistoryEntry } from '../../core/models/match.model';
import { MatchHistoryActions } from './match-history.actions';

interface MatchHistoryState {
  entries: MatchHistoryEntry[];
  loaded: boolean;
  error: string | null;
}

const initialState: MatchHistoryState = {
  entries: [],
  loaded: false,
  error: null,
};

export const matchHistoryFeature = createFeature({
  name: 'matchHistory',
  reducer: createReducer(
    initialState,
    on(MatchHistoryActions.load, (state): MatchHistoryState => ({ ...state, error: null })),
    on(
      MatchHistoryActions.loaded,
      (state, { entries }): MatchHistoryState => ({ ...state, entries, loaded: true }),
    ),
    on(MatchHistoryActions.failed, (state, { error }): MatchHistoryState => ({ ...state, error })),
  ),
});

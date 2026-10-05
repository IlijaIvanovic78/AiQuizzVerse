import { createFeature, createReducer, on } from '@ngrx/store';
import { MatchHistoryEntry } from '../../core/models/match.model';
import { MatchHistoryActions } from './match-history.actions';

interface MatchHistoryState {
  entries: MatchHistoryEntry[];
  loaded: boolean;
}

const initialState: MatchHistoryState = {
  entries: [],
  loaded: false,
};

export const matchHistoryFeature = createFeature({
  name: 'matchHistory',
  reducer: createReducer(
    initialState,
    on(
      MatchHistoryActions.loaded,
      (state, { entries }): MatchHistoryState => ({ ...state, entries, loaded: true }),
    ),
  ),
});

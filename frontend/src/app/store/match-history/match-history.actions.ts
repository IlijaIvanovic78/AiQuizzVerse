import { createAction, props } from '@ngrx/store';
import { MatchHistoryEntry } from './match-history.state';

export const loadMatchHistory = createAction('[MatchHistory] Load');
export const loadMatchHistorySuccess = createAction(
  '[MatchHistory] Load Success',
  props<{ matches: MatchHistoryEntry[] }>(),
);
export const loadMatchHistoryFailure = createAction(
  '[MatchHistory] Load Failure',
  props<{ error: string }>(),
);

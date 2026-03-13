import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RankedState } from './ranked.state';

export const selectRankedState = createFeatureSelector<RankedState>('ranked');

export const selectJourneys = createSelector(selectRankedState, (s) => s.journeys);
export const selectCurrentJourney = createSelector(selectRankedState, (s) => s.currentJourney);
export const selectRankedLoading = createSelector(selectRankedState, (s) => s.loading);
export const selectRankedError = createSelector(selectRankedState, (s) => s.error);

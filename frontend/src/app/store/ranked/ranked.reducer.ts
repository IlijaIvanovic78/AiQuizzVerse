import { createReducer, on } from '@ngrx/store';
import { RankedActions } from './ranked.actions';
import { initialRankedState } from './ranked.state';

export const rankedReducer = createReducer(
  initialRankedState,

  on(RankedActions.createJourney, (state) => ({ ...state, loading: true, error: null })),
  on(RankedActions.createJourneySuccess, (state, { journey }) => ({
    ...state,
    journeys: [journey, ...state.journeys],
    currentJourney: journey,
    loading: false,
  })),
  on(RankedActions.createJourneyFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(RankedActions.loadJourneys, (state) => ({ ...state, loading: true, error: null })),
  on(RankedActions.loadJourneysSuccess, (state, { journeys }) => ({ ...state, journeys, loading: false })),
  on(RankedActions.loadJourneysFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(RankedActions.loadJourney, (state) => ({ ...state, loading: true, error: null })),
  on(RankedActions.loadJourneySuccess, (state, { journey }) => ({ ...state, currentJourney: journey, loading: false })),
  on(RankedActions.loadJourneyFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(RankedActions.completeStage, (state) => ({ ...state, loading: true })),
  on(RankedActions.completeStageSuccess, (state, { result }) => {
    if (!state.currentJourney) return { ...state, loading: false };
    const updatedStages = state.currentJourney.stages.map((s) =>
      s.id === result.stage.id ? { ...s, isCompleted: true, score: result.stage.score, earnedReward: result.stage.earnedReward } : s,
    );
    const updatedJourney = {
      ...state.currentJourney,
      stages: updatedStages,
      currentStage: result.stage.stageNumber,
      isCompleted: result.journeyCompleted,
    };
    return {
      ...state,
      currentJourney: updatedJourney,
      journeys: state.journeys.map((j) => (j.id === updatedJourney.id ? updatedJourney : j)),
      loading: false,
    };
  }),
  on(RankedActions.completeStageFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(RankedActions.clearError, (state) => ({ ...state, error: null })),
);

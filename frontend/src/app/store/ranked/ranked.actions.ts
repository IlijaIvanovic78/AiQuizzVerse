import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { RankedJourney, StageCompleteResult } from '../../models';

export const RankedActions = createActionGroup({
  source: 'Ranked',
  events: {
    'Create Journey': props<{ topic: string; totalStages?: number }>(),
    'Create Journey Success': props<{ journey: RankedJourney }>(),
    'Create Journey Failure': props<{ error: string }>(),

    'Load Journeys': emptyProps(),
    'Load Journeys Success': props<{ journeys: RankedJourney[] }>(),
    'Load Journeys Failure': props<{ error: string }>(),

    'Load Journey': props<{ id: string }>(),
    'Load Journey Success': props<{ journey: RankedJourney }>(),
    'Load Journey Failure': props<{ error: string }>(),

    'Complete Stage': props<{ journeyId: string; stageId: string; score: number }>(),
    'Complete Stage Success': props<{ result: StageCompleteResult }>(),
    'Complete Stage Failure': props<{ error: string }>(),

    'Clear Error': emptyProps(),
  },
});

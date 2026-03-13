import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { RankedActions } from './ranked.actions';
import { RankedApiService } from '../../services';
import { map, catchError, exhaustMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class RankedEffects {
  private readonly actions$ = inject(Actions);
  private readonly rankedApi = inject(RankedApiService);

  createJourney$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RankedActions.createJourney),
      exhaustMap(({ topic, totalStages }) =>
        this.rankedApi.createJourney(topic, totalStages).pipe(
          map((journey) => RankedActions.createJourneySuccess({ journey })),
          catchError((err) => of(RankedActions.createJourneyFailure({ error: err.error?.message || 'Failed to create journey' }))),
        ),
      ),
    ),
  );

  loadJourneys$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RankedActions.loadJourneys),
      exhaustMap(() =>
        this.rankedApi.getJourneys().pipe(
          map((journeys) => RankedActions.loadJourneysSuccess({ journeys })),
          catchError((err) => of(RankedActions.loadJourneysFailure({ error: err.error?.message || 'Failed to load' }))),
        ),
      ),
    ),
  );

  loadJourney$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RankedActions.loadJourney),
      exhaustMap(({ id }) =>
        this.rankedApi.getJourney(id).pipe(
          map((journey) => RankedActions.loadJourneySuccess({ journey })),
          catchError((err) => of(RankedActions.loadJourneyFailure({ error: err.error?.message || 'Journey not found' }))),
        ),
      ),
    ),
  );

  completeStage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RankedActions.completeStage),
      exhaustMap(({ journeyId, stageId, score }) =>
        this.rankedApi.completeStage(journeyId, stageId, score).pipe(
          map((result) => RankedActions.completeStageSuccess({ result })),
          catchError((err) => of(RankedActions.completeStageFailure({ error: err.error?.message || 'Failed' }))),
        ),
      ),
    ),
  );
}

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { ReviewApiService } from '../../core/api/review-api.service';
import { PracticeRequest } from '../../core/models/review.model';
import { ToastService } from '../../core/notifications/toast.service';
import { MatchActions } from '../match/match.actions';
import { ReviewActions } from './review.actions';

@Injectable()
export class ReviewEffects {
  private readonly actions$ = inject(Actions);
  private readonly reviewApi = inject(ReviewApiService);
  private readonly toast = inject(ToastService);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReviewActions.load),
      switchMap(() =>
        this.reviewApi.getDeck().pipe(
          map((deck) => ReviewActions.loaded({ deck })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly practice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReviewActions.practice),
      exhaustMap(({ questionIds }) =>
        this.reviewApi.practice(toPracticeRequest(questionIds)).pipe(
          map(({ quizId }) => ReviewActions.practiceReady({ quizId })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly startPractice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReviewActions.practiceReady),
      map(({ quizId }) => MatchActions.create({ request: { quizId, mode: 'SOLO' } })),
    ),
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ReviewActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private failed(error: unknown): Action {
    return ReviewActions.failed({ error: readErrorMessage(error) });
  }
}

// An empty list means "practice everything that is due today".
function toPracticeRequest(questionIds: string[]): PracticeRequest {
  return questionIds.length > 0 ? { questionIds } : {};
}

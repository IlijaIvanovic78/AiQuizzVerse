import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { catchError, concatMap, exhaustMap, filter, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage, readErrorStatus } from '../../core/api/api-error';
import { QuizzesApiService } from '../../core/api/quizzes-api.service';
import { ToastService } from '../../core/notifications/toast.service';
import { isOnCreatePage } from '../create-page';
import { MatchActions } from '../match/match.actions';
import { QuizzesActions } from './quizzes.actions';

@Injectable()
export class QuizzesEffects {
  private readonly actions$ = inject(Actions);
  private readonly quizzesApi = inject(QuizzesApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.load),
      switchMap(() =>
        this.quizzesApi.list().pipe(
          map((quizzes) => QuizzesActions.loaded({ quizzes })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly loadFeatured$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.loadFeatured),
      switchMap(() =>
        this.quizzesApi.featured().pipe(
          map((quizzes) => QuizzesActions.featuredLoaded({ quizzes })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly loadDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.loadDetail),
      switchMap(({ quizId }) =>
        this.quizzesApi.get(quizId).pipe(
          map((quiz) => QuizzesActions.detailLoaded({ quiz })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.create),
      exhaustMap(({ request }) =>
        this.quizzesApi.create(request).pipe(
          map((quiz) => QuizzesActions.created({ quiz })),
          catchError((error: unknown) => of(this.creationFailed(error))),
        ),
      ),
    ),
  );

  readonly generate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.generate),
      exhaustMap(({ request }) =>
        this.quizzesApi.generate(request).pipe(
          map((quiz) => QuizzesActions.created({ quiz })),
          catchError((error: unknown) => of(this.creationFailed(error))),
        ),
      ),
    ),
  );

  readonly update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.update),
      concatMap(({ quizId, changes }) =>
        this.quizzesApi.update(quizId, changes).pipe(
          map((quiz) => QuizzesActions.updated({ quiz })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly addQuestion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.addQuestion),
      concatMap(({ quizId, question }) =>
        this.quizzesApi.addQuestion(quizId, question).pipe(
          map((saved) => QuizzesActions.questionAdded({ quizId, question: saved })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly updateQuestion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.updateQuestion),
      concatMap(({ quizId, questionId, question }) =>
        this.quizzesApi.updateQuestion(quizId, questionId, question).pipe(
          map((saved) => QuizzesActions.questionUpdated({ quizId, question: saved })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly deleteQuestion$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.deleteQuestion),
      concatMap(({ quizId, questionId }) =>
        this.quizzesApi.deleteQuestion(quizId, questionId).pipe(
          map(() => QuizzesActions.questionDeleted({ quizId, questionId })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.delete),
      exhaustMap(({ quizId }) =>
        this.quizzesApi.delete(quizId).pipe(
          map(() => QuizzesActions.deleted({ quizId })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly announceCreated$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuizzesActions.created),
        filter(() => !isOnCreatePage(this.router)),
        tap(({ quiz }) =>
          this.toast.success(`"${quiz.title}" is ready!`, {
            label: 'Play now',
            action: MatchActions.create({ request: { quizId: quiz.id, mode: 'SOLO' } }),
          }),
        ),
      ),
    { dispatch: false },
  );

  readonly announceSaved$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          QuizzesActions.updated,
          QuizzesActions.questionAdded,
          QuizzesActions.questionUpdated,
        ),
        tap(() => this.toast.success('Saved!')),
      ),
    { dispatch: false },
  );

  readonly leaveDeletedQuiz$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuizzesActions.deleted),
        tap(() => {
          this.toast.info('Quiz deleted.');
          void this.router.navigateByUrl('/library');
        }),
      ),
    { dispatch: false },
  );

  readonly announceCreationFailed$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuizzesActions.creationFailed),
        filter(() => !isOnCreatePage(this.router)),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuizzesActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private failed(error: unknown): Action {
    return QuizzesActions.failed({ error: readErrorMessage(error) });
  }

  private creationFailed(error: unknown): Action {
    return QuizzesActions.creationFailed({
      error: readErrorMessage(error),
      status: readErrorStatus(error),
    });
  }
}

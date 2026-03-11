import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { QuizActions } from './quiz.actions';
import { QuizApiService, ToastService } from '../../services';

@Injectable()
export class QuizEffects {
  private actions$ = inject(Actions);
  private quizApi = inject(QuizApiService);
  private toastService = inject(ToastService);

  // Generate Quiz
  generateQuiz$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizActions.generateQuiz),
      switchMap(({ request }) =>
        this.quizApi.generateQuiz(request).pipe(
          map((quiz) => QuizActions.generateQuizSuccess({ quiz })),
          catchError((error) =>
            of(QuizActions.generateQuizFailure({ error: error?.error?.message || error.message }))
          )
        )
      )
    )
  );

  // Show toast on generate success
  generateQuizSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuizActions.generateQuizSuccess),
        tap(({ quiz }) => {
          this.toastService.success(
            'Quiz Generated!',
            `"${quiz.title}" with ${quiz.questions.length} questions is ready.`
          );
        })
      ),
    { dispatch: false }
  );

  // Show toast on generate failure
  generateQuizFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuizActions.generateQuizFailure),
        tap(({ error }) => {
          this.toastService.error('Generation Failed', error);
        })
      ),
    { dispatch: false }
  );

  // Upload PDF
  uploadPdf$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizActions.uploadPdf),
      switchMap(({ file }) =>
        this.quizApi.uploadPdf(file).pipe(
          map((response) => QuizActions.uploadPdfSuccess({ response })),
          catchError((error) =>
            of(QuizActions.uploadPdfFailure({ error: error?.error?.message || error.message }))
          )
        )
      )
    )
  );

  // Show toast on upload success
  uploadPdfSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuizActions.uploadPdfSuccess),
        tap(({ response }) => {
          this.toastService.success(
            'PDF Uploaded',
            `${response.fileName} processed (${response.chunks} chunks).`
          );
        })
      ),
    { dispatch: false }
  );

  // Load My Quizzes
  loadMyQuizzes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizActions.loadMyQuizzes),
      switchMap(() =>
        this.quizApi.getMyQuizzes().pipe(
          map((quizzes) => QuizActions.loadMyQuizzesSuccess({ quizzes })),
          catchError((error) =>
            of(QuizActions.loadMyQuizzesFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Load Quiz Detail
  loadQuizDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizActions.loadQuizDetail),
      switchMap(({ quizId }) =>
        this.quizApi.getQuizDetail(quizId).pipe(
          map((quiz) => QuizActions.loadQuizDetailSuccess({ quiz })),
          catchError((error) =>
            of(QuizActions.loadQuizDetailFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Delete Quiz
  deleteQuiz$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizActions.deleteQuiz),
      switchMap(({ quizId }) =>
        this.quizApi.deleteQuiz(quizId).pipe(
          map(() => QuizActions.deleteQuizSuccess({ quizId })),
          catchError((error) =>
            of(QuizActions.deleteQuizFailure({ error: error.message }))
          )
        )
      )
    )
  );

  // Show toast on delete success
  deleteQuizSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(QuizActions.deleteQuizSuccess),
        tap(() => {
          this.toastService.success('Quiz Deleted', 'Quiz has been removed.');
        })
      ),
    { dispatch: false }
  );
}

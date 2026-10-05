import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { catchError, exhaustMap, filter, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage, readErrorStatus } from '../../core/api/api-error';
import { PathsApiService } from '../../core/api/paths-api.service';
import { ToastService } from '../../core/notifications/toast.service';
import { isOnCreatePage } from '../create-page';
import { PathsActions } from './paths.actions';

@Injectable()
export class PathsEffects {
  private readonly actions$ = inject(Actions);
  private readonly pathsApi = inject(PathsApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PathsActions.load),
      switchMap(() =>
        this.pathsApi.list().pipe(
          map((paths) => PathsActions.loaded({ paths })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly loadDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PathsActions.loadDetail),
      switchMap(({ pathId }) =>
        this.pathsApi.get(pathId).pipe(
          map((path) => PathsActions.detailLoaded({ path })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PathsActions.create),
      exhaustMap(({ request }) =>
        this.pathsApi.create(request).pipe(
          map((path) => PathsActions.created({ path })),
          catchError((error: unknown) => of(this.creationFailed(error))),
        ),
      ),
    ),
  );

  readonly delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PathsActions.delete),
      exhaustMap(({ pathId }) =>
        this.pathsApi.delete(pathId).pipe(
          map(() => PathsActions.deleted({ pathId })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly announceCreated$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PathsActions.created),
        filter(() => !isOnCreatePage(this.router)),
        tap(({ path }) => this.toast.success(`Your path about "${path.topic}" is ready!`)),
      ),
    { dispatch: false },
  );

  readonly leaveDeletedPath$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PathsActions.deleted),
        tap(() => {
          this.toast.info('Learning path deleted.');
          void this.router.navigateByUrl('/paths');
        }),
      ),
    { dispatch: false },
  );

  readonly announceCreationFailed$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PathsActions.creationFailed),
        filter(() => !isOnCreatePage(this.router)),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PathsActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private failed(error: unknown): Action {
    return PathsActions.failed({ error: readErrorMessage(error) });
  }

  private creationFailed(error: unknown): Action {
    return PathsActions.creationFailed({
      error: readErrorMessage(error),
      status: readErrorStatus(error),
    });
  }
}

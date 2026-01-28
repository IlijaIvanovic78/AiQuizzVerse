import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, exhaustMap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import * as AppStatusActions from './app-status.actions';

@Injectable()
export class AppStatusEffects {
  private readonly actions$ = inject(Actions);
  private readonly apiService = inject(ApiService);

  loadHealth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppStatusActions.loadHealth),
      exhaustMap(() =>
        this.apiService.getHealth().pipe(
          map((response) =>
            AppStatusActions.loadHealthSuccess({ serverTime: response.time })
          ),
          catchError((error) =>
            of(
              AppStatusActions.loadHealthFailure({
                error: error?.message || 'Failed to connect to server',
              })
            )
          )
        )
      )
    )
  );
}

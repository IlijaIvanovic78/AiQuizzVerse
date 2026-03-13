import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AvatarActions } from './avatar.actions';
import { AuthActions } from '../auth/auth.actions';
import { AvatarApiService } from '../../services';
import { map, catchError, exhaustMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class AvatarEffects {
  private readonly actions$ = inject(Actions);
  private readonly avatarApi = inject(AvatarApiService);

  loadItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvatarActions.loadItems),
      exhaustMap(() =>
        this.avatarApi.getMyItems().pipe(
          map((items) => AvatarActions.loadItemsSuccess({ items })),
          catchError((err) => of(AvatarActions.loadItemsFailure({ error: err.error?.message || 'Failed to load' }))),
        ),
      ),
    ),
  );

  loadEquipped$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvatarActions.loadEquipped),
      exhaustMap(() =>
        this.avatarApi.getEquipped().pipe(
          map((equipped) => AvatarActions.loadEquippedSuccess({ equipped })),
        ),
      ),
    ),
  );

  selectAvatar$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvatarActions.selectAvatar),
      exhaustMap(({ userItemId }) =>
        this.avatarApi.selectAvatar(userItemId).pipe(
          switchMap((equipped) => [AvatarActions.selectAvatarSuccess({ equipped }), AuthActions.loadProfile()]),
          catchError((err) => of(AvatarActions.selectAvatarFailure({ error: err.error?.message || 'Failed' }))),
        ),
      ),
    ),
  );

  loadStarters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvatarActions.loadStarters),
      exhaustMap(() =>
        this.avatarApi.getStarters().pipe(
          map((starters) => AvatarActions.loadStartersSuccess({ starters })),
        ),
      ),
    ),
  );

  selectStarter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvatarActions.selectStarter),
      exhaustMap(({ itemId }) =>
        this.avatarApi.selectStarter(itemId).pipe(
          switchMap((userItem) => [AvatarActions.selectStarterSuccess({ userItem }), AuthActions.loadProfile()]),
          catchError((err) => of(AvatarActions.selectStarterFailure({ error: err.error?.message || 'Failed' }))),
        ),
      ),
    ),
  );
}

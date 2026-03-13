import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ShopActions } from './shop.actions';
import { AuthActions } from '../auth/auth.actions';
import { ShopApiService } from '../../services';
import { map, catchError, exhaustMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class ShopEffects {
  private readonly actions$ = inject(Actions);
  private readonly shopApi = inject(ShopApiService);

  loadItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.loadItems),
      exhaustMap(() =>
        this.shopApi.getItems().pipe(
          map((items) => ShopActions.loadItemsSuccess({ items })),
          catchError((err) => of(ShopActions.loadItemsFailure({ error: err.error?.message || 'Failed to load items' }))),
        ),
      ),
    ),
  );

  buyItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.buyItem),
      exhaustMap(({ itemId }) =>
        this.shopApi.buyItem(itemId).pipe(
          switchMap((userItem) => [ShopActions.buyItemSuccess({ userItem }), AuthActions.loadProfile()]),
          catchError((err) => {
            const msg = err?.error?.message || err?.message || 'Purchase failed';
            return of(ShopActions.buyItemFailure({ error: Array.isArray(msg) ? msg.join(', ') : msg }));
          }),
        ),
      ),
    ),
  );

  buyBoost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.buyBoost),
      exhaustMap(({ boostType }) =>
        this.shopApi.buyBoost(boostType).pipe(
          switchMap((boost) => [ShopActions.buyBoostSuccess({ boost }), AuthActions.loadProfile()]),
          catchError((err) => of(ShopActions.buyBoostFailure({ error: err.error?.message || 'Purchase failed' }))),
        ),
      ),
    ),
  );

  loadBoosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.loadBoosts),
      exhaustMap(() =>
        this.shopApi.getMyBoosts().pipe(
          map((boosts) => ShopActions.loadBoostsSuccess({ boosts })),
          catchError((err) => of(ShopActions.loadBoostsFailure({ error: err.error?.message || 'Failed to load boosts' }))),
        ),
      ),
    ),
  );
}

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { ShopApiService } from '../../core/api/shop-api.service';
import { readReturnUrl } from '../../core/auth/return-url';
import { ToastService } from '../../core/notifications/toast.service';
import { ShopActions } from './shop.actions';

@Injectable()
export class ShopEffects {
  private readonly actions$ = inject(Actions);
  private readonly shopApi = inject(ShopApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loadItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.loadItems),
      switchMap(() =>
        this.shopApi.items().pipe(
          map((items) => ShopActions.itemsLoaded({ items })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly buyItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.buyItem),
      exhaustMap(({ itemId }) =>
        this.shopApi.buyItem(itemId).pipe(
          map(({ coins, item }) => ShopActions.itemBought({ coins, item })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly equipItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.equipItem),
      exhaustMap(({ itemId }) =>
        this.shopApi.equipItem(itemId).pipe(
          map((user) => ShopActions.itemEquipped({ user })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly unequipPet$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.unequipPet),
      exhaustMap(() =>
        this.shopApi.unequipPet().pipe(
          map((user) => ShopActions.petUnequipped({ user })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly claimStarter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.claimStarter),
      exhaustMap(({ itemId }) =>
        this.shopApi.claimStarter(itemId).pipe(
          map((user) => ShopActions.starterClaimed({ user })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly loadBoosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.loadBoosts),
      switchMap(() =>
        this.shopApi.boosts().pipe(
          map((boosts) => ShopActions.boostsLoaded({ boosts })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly buyBoost$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShopActions.buyBoost),
      exhaustMap(({ boostType }) =>
        this.shopApi.buyBoost(boostType).pipe(
          map(({ coins, boost }) => ShopActions.boostBought({ coins, boost })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly announceItem$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ShopActions.itemBought),
        tap(({ item }) =>
          this.toast.success(`${item.name} joined your team!`, {
            label: 'Equip',
            action: ShopActions.equipItem({ itemId: item.id }),
          }),
        ),
      ),
    { dispatch: false },
  );

  readonly announceBoost$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ShopActions.boostBought),
        tap(({ boost }) => this.toast.success(`+1 ${boost.name}`)),
      ),
    { dispatch: false },
  );

  readonly enterAfterStarter$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ShopActions.starterClaimed),
        tap(() => void this.router.navigateByUrl(readReturnUrl(this.router) ?? '/home')),
      ),
    { dispatch: false },
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ShopActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private failed(error: unknown): Action {
    return ShopActions.failed({ error: readErrorMessage(error) });
  }
}

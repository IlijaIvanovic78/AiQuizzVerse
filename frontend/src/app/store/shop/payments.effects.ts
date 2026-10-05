import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { PaymentsApiService } from '../../core/api/payments-api.service';
import { CheckoutSession } from '../../core/models/payment.model';
import { ToastService } from '../../core/notifications/toast.service';
import { PaymentsActions } from './payments.actions';

@Injectable()
export class PaymentsEffects {
  private readonly actions$ = inject(Actions);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loadPackages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPackages),
      switchMap(() =>
        this.paymentsApi.packages().pipe(
          map((packages) => PaymentsActions.packagesLoaded({ packages })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly checkout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.checkout),
      exhaustMap(({ packageId }) =>
        this.paymentsApi.checkout({ packageId }).pipe(
          map((session) => PaymentsActions.checkoutOpened({ session })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly goToCheckout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PaymentsActions.checkoutOpened),
        tap(({ session }) => this.openCheckout(session)),
      ),
    { dispatch: false },
  );

  readonly loadPurchase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadPurchase),
      switchMap(({ purchaseId }) =>
        this.paymentsApi.get(purchaseId).pipe(
          map((purchase) => PaymentsActions.purchaseLoaded({ purchase })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly confirmPurchase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.confirmPurchase),
      exhaustMap(({ purchaseId }) =>
        this.paymentsApi.confirm(purchaseId).pipe(
          map(({ purchase, coins }) => PaymentsActions.purchaseConfirmed({ purchase, coins })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly cancelPurchase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.cancelPurchase),
      exhaustMap(({ purchaseId }) =>
        this.paymentsApi.cancel(purchaseId).pipe(
          map((purchase) => PaymentsActions.purchaseCancelled({ purchase })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PaymentsActions.loadHistory),
      switchMap(() =>
        this.paymentsApi.history().pipe(
          map((purchases) => PaymentsActions.historyLoaded({ purchases })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly announcePaid$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PaymentsActions.purchaseConfirmed),
        tap(({ purchase }) => {
          if (purchase.status === 'PAID') {
            this.toast.success(`${purchase.coins} coins added to your bag!`);
          }
        }),
      ),
    { dispatch: false },
  );

  readonly announceCancelled$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PaymentsActions.purchaseCancelled),
        tap(() => this.toast.info('Purchase cancelled. No money was charged.')),
      ),
    { dispatch: false },
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PaymentsActions.failed),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  // Stripe hosts its own checkout page; the demo checkout is a page inside this app.
  private openCheckout(session: CheckoutSession): void {
    if (session.provider === 'stripe') {
      window.location.assign(session.checkoutUrl);
      return;
    }
    void this.router.navigateByUrl(session.checkoutUrl);
  }

  private failed(error: unknown) {
    return PaymentsActions.failed({ error: readErrorMessage(error) });
  }
}

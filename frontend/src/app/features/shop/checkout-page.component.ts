import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CoinAmountComponent } from '../../shared/components/coin-amount.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { PaymentsActions } from '../../store/shop/payments.actions';
import { shopFeature } from '../../store/shop/shop.reducer';
import { PackArtComponent } from './components/pack-art.component';
import { CANCELLED_PAYMENT_STATUS, SUCCESS_PAYMENT_STATUS } from './shop.constants';

// The demo provider's stand-in for a hosted payment page such as Stripe Checkout.
@Component({
  selector: 'app-checkout-page',
  imports: [
    RouterLink,
    PricePipe,
    CoinAmountComponent,
    EmptyStateComponent,
    PixelIconComponent,
    SpinnerComponent,
    PackArtComponent,
  ],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent {
  readonly purchaseId = input.required<string>();

  private readonly store = inject(Store);
  private readonly router = inject(Router);

  private readonly storedPurchase = this.store.selectSignal(shopFeature.selectPurchase);
  protected readonly loading = this.store.selectSignal(shopFeature.selectLoading);
  protected readonly error = this.store.selectSignal(shopFeature.selectError);

  protected readonly purchase = computed(() => {
    const purchase = this.storedPurchase();
    return purchase?.id === this.purchaseId() ? purchase : null;
  });

  constructor() {
    effect(() => {
      const purchaseId = this.purchaseId();
      untracked(() => this.store.dispatch(PaymentsActions.loadPurchase({ purchaseId })));
    });
  }

  protected reload(): void {
    this.store.dispatch(PaymentsActions.loadPurchase({ purchaseId: this.purchaseId() }));
  }

  protected pay(): void {
    this.returnWithStatus(SUCCESS_PAYMENT_STATUS);
  }

  protected cancel(): void {
    this.returnWithStatus(CANCELLED_PAYMENT_STATUS);
  }

  // Like a real provider, the checkout only sends the player back with a status.
  // The result page then asks the server whether the purchase is really paid.
  private returnWithStatus(status: string): void {
    void this.router.navigate(['/shop/payment', this.purchaseId()], { queryParams: { status } });
  }
}

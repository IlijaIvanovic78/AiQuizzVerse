import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { PurchaseStatus } from '../../core/models/payment.model';
import { SoundService } from '../../core/sound/sound.service';
import { CoinAmountComponent } from '../../shared/components/coin-amount.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { authFeature } from '../../store/auth/auth.reducer';
import { PaymentsActions } from '../../store/shop/payments.actions';
import { shopFeature } from '../../store/shop/shop.reducer';
import { CANCELLED_PAYMENT_STATUS } from './shop.constants';

type PaymentOutcome = 'checking' | 'paid' | 'pending' | 'cancelled' | 'failed';

const BURST_COINS = [
  { x: '-110px', y: '-70px', delay: '0ms' },
  { x: '-70px', y: '-130px', delay: '80ms' },
  { x: '-20px', y: '-150px', delay: '30ms' },
  { x: '30px', y: '-140px', delay: '120ms' },
  { x: '80px', y: '-120px', delay: '50ms' },
  { x: '115px', y: '-60px', delay: '150ms' },
  { x: '-40px', y: '-95px', delay: '200ms' },
  { x: '50px', y: '-85px', delay: '240ms' },
];

@Component({
  selector: 'app-payment-result-page',
  imports: [RouterLink, CoinAmountComponent, PixelIconComponent, SpinnerComponent],
  templateUrl: './payment-result-page.component.html',
  styleUrl: './payment-result-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentResultPageComponent {
  readonly purchaseId = input.required<string>();
  readonly status = input<string>();

  private readonly store = inject(Store);
  private readonly sound = inject(SoundService);

  private readonly storedPurchase = this.store.selectSignal(shopFeature.selectPurchase);
  private readonly busy = this.store.selectSignal(shopFeature.selectBusy);
  protected readonly error = this.store.selectSignal(shopFeature.selectError);
  protected readonly coins = this.store.selectSignal(authFeature.selectCoins);
  protected readonly burstCoins = BURST_COINS;

  protected readonly purchase = computed(() => {
    const purchase = this.storedPurchase();
    return purchase?.id === this.purchaseId() ? purchase : null;
  });

  protected readonly outcome = computed<PaymentOutcome>(() => {
    const purchase = this.purchase();
    if (this.busy()) {
      return 'checking';
    }
    if (purchase) {
      return outcomeForStatus(purchase.status);
    }
    return this.error() ? 'failed' : 'checking';
  });

  constructor() {
    effect(() => {
      const purchaseId = this.purchaseId();
      const cancelled = this.status() === CANCELLED_PAYMENT_STATUS;
      untracked(() => this.settle(purchaseId, cancelled));
    });
    effect(() => {
      if (this.outcome() === 'paid') {
        untracked(() => this.sound.playCoin());
      }
    });
  }

  protected checkAgain(): void {
    this.store.dispatch(PaymentsActions.confirmPurchase({ purchaseId: this.purchaseId() }));
  }

  // The status in the URL is only a hint from the provider; the server decides what really
  // happened, so a "success" link can still turn out pending and a "cancelled" one paid.
  private settle(purchaseId: string, cancelled: boolean): void {
    if (cancelled) {
      this.store.dispatch(PaymentsActions.cancelPurchase({ purchaseId }));
      return;
    }
    this.store.dispatch(PaymentsActions.confirmPurchase({ purchaseId }));
  }
}

function outcomeForStatus(status: PurchaseStatus): PaymentOutcome {
  if (status === 'PAID') {
    return 'paid';
  }
  return status === 'PENDING' ? 'pending' : 'cancelled';
}

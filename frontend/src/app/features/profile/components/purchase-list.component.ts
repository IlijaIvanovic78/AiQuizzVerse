import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PurchaseStatus, PurchaseView } from '../../../core/models/payment.model';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { PricePipe } from '../../../shared/pipes/price.pipe';

const STATUS_LOOKS: Record<PurchaseStatus, { label: string; badge: string }> = {
  PAID: { label: 'Paid', badge: 'badge-jade' },
  PENDING: { label: 'Not finished', badge: 'badge-torch' },
  CANCELLED: { label: 'Cancelled', badge: 'badge-fog' },
};

@Component({
  selector: 'app-purchase-list',
  imports: [DatePipe, DecimalPipe, PricePipe, SpinnerComponent],
  templateUrl: './purchase-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseListComponent {
  readonly purchases = input.required<PurchaseView[]>();
  readonly loading = input.required<boolean>();

  protected readonly rows = computed(() =>
    this.purchases().map((purchase) => ({
      purchase,
      ...STATUS_LOOKS[purchase.status],
    })),
  );
}

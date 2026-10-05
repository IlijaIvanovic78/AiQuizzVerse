import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-payment-result-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Payment" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentResultPageComponent {
  readonly purchaseId = input.required<string>();
  readonly status = input<string>();
}

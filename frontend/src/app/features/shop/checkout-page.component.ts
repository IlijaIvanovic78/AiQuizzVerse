import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-checkout-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Checkout" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent {
  readonly purchaseId = input.required<string>();
}

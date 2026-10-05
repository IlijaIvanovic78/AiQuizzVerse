import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoostOffer } from '../../../core/models/shop.model';
import { BoostIconComponent } from '../../../shared/components/boost-icon.component';
import { CoinAmountComponent } from '../../../shared/components/coin-amount.component';

@Component({
  selector: 'app-boost-card',
  imports: [RouterLink, BoostIconComponent, CoinAmountComponent],
  templateUrl: './boost-card.component.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoostCardComponent {
  readonly offer = input.required<BoostOffer>();
  readonly busy = input(false);
  readonly buy = output<BoostOffer>();
}

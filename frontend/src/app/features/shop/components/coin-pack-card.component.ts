import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CoinPackage } from '../../../core/models/payment.model';
import { CoinAmountComponent } from '../../../shared/components/coin-amount.component';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { PackArtComponent } from './pack-art.component';

@Component({
  selector: 'app-coin-pack-card',
  imports: [PricePipe, CoinAmountComponent, PackArtComponent],
  templateUrl: './coin-pack-card.component.html',
  styleUrl: './coin-pack-card.component.css',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoinPackCardComponent {
  readonly pack = input.required<CoinPackage>();
  readonly busy = input(false);
  readonly buy = output<CoinPackage>();
}

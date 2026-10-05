import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoinAmountComponent } from '../../../shared/components/coin-amount.component';
import { ModalComponent } from '../../../shared/components/modal.component';

// Confirms a coin purchase. The preview (sprite or icon) is passed in as content.
@Component({
  selector: 'app-buy-dialog',
  imports: [RouterLink, CoinAmountComponent, ModalComponent],
  templateUrl: './buy-dialog.component.html',
  styleUrl: './buy-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyDialogComponent {
  readonly name = input.required<string>();
  readonly price = input.required<number>();
  readonly coins = input.required<number>();
  readonly confirmed = output<void>();
  readonly closed = output<void>();

  protected readonly affordable = computed(() => this.coins() >= this.price());
  protected readonly coinsLeft = computed(() => this.coins() - this.price());
  protected readonly coinsMissing = computed(() => this.price() - this.coins());
  protected readonly title = computed(() =>
    this.affordable() ? `Buy ${this.name()}?` : 'Not enough coins',
  );
}

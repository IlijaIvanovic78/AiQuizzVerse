import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PixelIconComponent } from './pixel-icon.component';

export type CoinAmountSize = 'sm' | 'md' | 'lg';

const TEXT_CLASSES: Record<CoinAmountSize, string> = {
  sm: 'text-sm font-semibold',
  md: 'font-semibold',
  lg: 'font-display text-xl',
};

@Component({
  selector: 'app-coin-amount',
  imports: [DecimalPipe, PixelIconComponent],
  template: `
    <span class="inline-flex items-center gap-1.5">
      <app-pixel-icon name="coin" [scale]="size() === 'lg' ? 3 : 2" />
      <span class="text-gold" [class]="textClass()">
        {{ amount() | number }}<span class="sr-only"> coins</span>
      </span>
    </span>
  `,
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoinAmountComponent {
  readonly amount = input.required<number>();
  readonly size = input<CoinAmountSize>('md');

  protected readonly textClass = computed(() => TEXT_CLASSES[this.size()]);
}

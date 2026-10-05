import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PixelIconComponent } from './pixel-icon.component';

type CoinAmountSize = 'sm' | 'md' | 'lg';
// Gold text is for the dark panels; parchment needs ink to stay readable.
type CoinAmountTone = 'gold' | 'ink';

const SIZE_CLASSES: Record<CoinAmountSize, string> = {
  sm: 'text-sm font-semibold',
  md: 'font-semibold',
  lg: 'font-display text-xl',
};

const TONE_CLASSES: Record<CoinAmountTone, string> = {
  gold: 'text-gold',
  ink: 'text-ink',
};

@Component({
  selector: 'app-coin-amount',
  imports: [DecimalPipe, PixelIconComponent],
  template: `
    <span class="inline-flex items-center gap-1.5">
      <app-pixel-icon name="coin" [scale]="size() === 'lg' ? 3 : 2" />
      <span [class]="textClass()">
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
  readonly tone = input<CoinAmountTone>('gold');

  protected readonly textClass = computed(
    () => `${SIZE_CLASSES[this.size()]} ${TONE_CLASSES[this.tone()]}`,
  );
}

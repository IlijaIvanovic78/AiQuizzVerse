import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STAR_POP_DELAY_MS } from '../stars';
import { PixelIconComponent } from './pixel-icon.component';

@Component({
  selector: 'app-star-rating',
  imports: [PixelIconComponent],
  template: `
    <span class="inline-flex items-center gap-1" role="img" [attr.aria-label]="label()">
      @for (filled of slots(); track $index) {
        <app-pixel-icon
          [name]="filled ? 'star' : 'star-empty'"
          [scale]="scale()"
          [class.animate-star-pop]="animated() && filled"
          [style.animation-delay.ms]="$index * popDelay"
        />
      }
    </span>
  `,
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRatingComponent {
  readonly stars = input.required<number>();
  readonly max = input(3);
  readonly scale = input(2);
  // Pops the earned stars in one after another, used on results screens.
  readonly animated = input(false);

  protected readonly popDelay = STAR_POP_DELAY_MS;
  protected readonly slots = computed(() =>
    Array.from({ length: this.max() }, (_, index) => index < this.stars()),
  );
  protected readonly label = computed(() => `${this.stars()} of ${this.max()} stars`);
}

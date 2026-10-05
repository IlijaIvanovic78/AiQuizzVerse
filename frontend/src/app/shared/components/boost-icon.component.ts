import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BoostType } from '../../core/models/shop.model';

type BoostIconSize = 'sm' | 'md' | 'lg';

interface BoostImage {
  src: string;
  // The 16px pixel icons need crisp scaling; the painted item icons do not.
  pixel: boolean;
}

const ICONS_URL = '/assets/images/icons/';

export const BOOST_LABELS: Record<BoostType, string> = {
  HINT: 'Hint',
  FIFTY_FIFTY: '50/50',
  EXTRA_TIME: 'Extra time',
  STREAK_FREEZE: 'Streak freeze',
};

const BOOST_IMAGES: Record<BoostType, BoostImage> = {
  HINT: { src: `${ICONS_URL}potion.webp`, pixel: false },
  FIFTY_FIFTY: { src: `${ICONS_URL}axes.webp`, pixel: false },
  EXTRA_TIME: { src: `${ICONS_URL}bolt.png`, pixel: true },
  STREAK_FREEZE: { src: `${ICONS_URL}shield.webp`, pixel: false },
};

const SIZE_CLASSES: Record<BoostIconSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

@Component({
  selector: 'app-boost-icon',
  template: `
    <img
      [src]="image().src"
      alt=""
      aria-hidden="true"
      class="h-full w-full object-contain"
      [class.pixelated]="image().pixel"
    />
  `,
  host: { class: 'inline-flex shrink-0', '[class]': 'sizeClass()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoostIconComponent {
  readonly type = input.required<BoostType>();
  readonly size = input<BoostIconSize>('md');

  protected readonly image = computed(() => BOOST_IMAGES[this.type()]);
  protected readonly sizeClass = computed(() => SIZE_CLASSES[this.size()]);
}

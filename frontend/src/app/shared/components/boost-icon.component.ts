import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BoostType } from '../../core/models/shop.model';
import { ICONS_URL, itemIconUrl } from '../icons';

type BoostIconSize = 'sm' | 'md' | 'lg';

interface BoostImage {
  src: string;
  pixelated: boolean;
}

const BOOST_IMAGES: Record<BoostType, BoostImage> = {
  HINT: { src: itemIconUrl('potion'), pixelated: false },
  FIFTY_FIFTY: { src: itemIconUrl('axes'), pixelated: false },
  EXTRA_TIME: { src: `${ICONS_URL}bolt.png`, pixelated: true },
  SECOND_CHANCE: { src: `${ICONS_URL}second-chance.png`, pixelated: true },
  STREAK_FREEZE: { src: itemIconUrl('shield'), pixelated: false },
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
      [class.pixelated]="image().pixelated"
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

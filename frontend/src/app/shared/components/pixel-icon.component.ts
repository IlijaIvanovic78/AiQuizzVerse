import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONS_URL } from '../icons';

export type PixelIconName =
  | 'coin'
  | 'star'
  | 'star-empty'
  | 'flame'
  | 'lock'
  | 'heart'
  | 'bolt'
  | 'check'
  | 'cross'
  | 'trophy';

const ICON_SIZE = 16;

@Component({
  selector: 'app-pixel-icon',
  template: `
    <img
      class="pixelated block"
      [src]="src()"
      [width]="size()"
      [height]="size()"
      [alt]="label()"
      [attr.aria-hidden]="label() ? null : true"
    />
  `,
  host: { class: 'inline-block shrink-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PixelIconComponent {
  readonly name = input.required<PixelIconName>();
  readonly scale = input(2);
  // An empty label marks the icon as decoration next to visible text.
  readonly label = input('');

  protected readonly src = computed(() => `${ICONS_URL}${this.name()}.png`);
  protected readonly size = computed(() => ICON_SIZE * this.scale());
}

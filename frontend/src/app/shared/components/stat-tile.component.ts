import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PixelIconComponent, PixelIconName } from './pixel-icon.component';

@Component({
  selector: 'app-stat-tile',
  imports: [PixelIconComponent],
  template: `
    <div class="panel flex h-full flex-col gap-2 p-4">
      <span class="flex items-center gap-2 text-sm text-muted">
        @if (icon(); as icon) {
          <app-pixel-icon [name]="icon" />
        }
        {{ label() }}
      </span>
      <span class="font-display text-xl text-parchment-100">{{ value() }}</span>
    </div>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<PixelIconName | null>(null);
}

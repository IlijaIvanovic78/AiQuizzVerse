import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { PARTY_MAX_CHARGES } from '../play.constants';

// One bolt for every sabotage charge a party player can hold; the empty ones are faded.
// The callers say the number in words, so the bolts are hidden from screen readers.
@Component({
  selector: 'app-charge-meter',
  imports: [PixelIconComponent],
  template: `
    @for (slot of slots; track slot) {
      <app-pixel-icon name="bolt" [scale]="1" [class.opacity-25]="slot >= charges()" />
    }
  `,
  host: { class: 'flex items-center', 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChargeMeterComponent {
  readonly charges = input.required<number>();

  protected readonly slots = Array.from({ length: PARTY_MAX_CHARGES }, (_, slot) => slot);
}

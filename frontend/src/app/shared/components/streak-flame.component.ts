import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PixelIconComponent } from './pixel-icon.component';

@Component({
  selector: 'app-streak-flame',
  imports: [PixelIconComponent],
  template: `<app-pixel-icon name="flame" [scale]="3" [class.flame-out]="streak() === 0" />`,
  styles: `
    /* A cold flame: the streak has not started yet. */
    .flame-out {
      opacity: 0.4;
      filter: grayscale(1);
    }
  `,
  host: { class: 'inline-flex shrink-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreakFlameComponent {
  readonly streak = input.required<number>();
}

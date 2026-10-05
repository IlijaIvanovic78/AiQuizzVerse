import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';

// Where the clouds float, in percent of the covered area.
const PUFFS = [
  { top: 6, left: 4, delayMs: 0 },
  { top: 30, left: 58, delayMs: 400 },
  { top: 55, left: 14, delayMs: 800 },
  { top: 74, left: 66, delayMs: 200 },
];

// FOG sabotage: a cloud that blurs the question and the answers for a few seconds.
// Like the ink it only hides things; the answers under it can still be clicked. The arena
// banner already says who sent the fog, so the cloud is hidden from screen readers.
@Component({
  selector: 'app-fog-cloud',
  imports: [PixelIconComponent],
  templateUrl: './fog-cloud.component.html',
  styleUrl: './fog-cloud.component.css',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FogCloudComponent {
  readonly active = input.required<boolean>();

  protected readonly puffs = PUFFS;
}

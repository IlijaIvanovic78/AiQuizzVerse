import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PixelIconComponent } from './pixel-icon.component';
import { ProgressBarComponent } from './progress-bar.component';

const STAR_THRESHOLDS = [0.6, 0.8, 1];

const BURST_COINS = [
  { x: '-64px', y: '-56px', delay: '0ms' },
  { x: '-32px', y: '-92px', delay: '60ms' },
  { x: '0px', y: '-108px', delay: '20ms' },
  { x: '34px', y: '-88px', delay: '90ms' },
  { x: '66px', y: '-52px', delay: '40ms' },
  { x: '14px', y: '-70px', delay: '120ms' },
];

@Component({
  selector: 'app-treasure-chest',
  imports: [PixelIconComponent, ProgressBarComponent],
  templateUrl: './treasure-chest.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasureChestComponent {
  // A fraction from 0 to 1; the stars mark 60%, 80% and 100%.
  readonly progress = input(0);
  // Every new number plays the lid bounce and the coin burst once.
  readonly burst = input(0);
  readonly label = input('Treasure chest progress');

  protected readonly coins = BURST_COINS;
  protected readonly burstKeys = computed(() => [{ id: this.burst() }]);
  protected readonly markers = computed(() =>
    STAR_THRESHOLDS.map((threshold) => ({
      threshold,
      left: `${threshold * 100}%`,
      reached: this.progress() >= threshold,
    })),
  );
}

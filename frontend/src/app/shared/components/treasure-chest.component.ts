import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { STAR_ACCURACIES } from '../stars';
import { PixelIconComponent } from './pixel-icon.component';
import { ProgressBarComponent } from './progress-bar.component';

const FULL_PERCENT = 100;

// The chest bar of solo, path and team games. Every right answer fills it, and the stars on it
// light up at the accuracies that earn a star.
@Component({
  selector: 'app-treasure-chest',
  imports: [PixelIconComponent, ProgressBarComponent],
  templateUrl: './treasure-chest.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreasureChestComponent {
  readonly correct = input.required<number>();
  readonly total = input.required<number>();
  readonly label = input('Treasure chest');

  protected readonly fraction = computed(() =>
    this.total() > 0 ? this.correct() / this.total() : 0,
  );
  protected readonly markers = computed(() =>
    STAR_ACCURACIES.map((accuracy) => ({
      accuracy,
      reached: this.fraction() * FULL_PERCENT >= accuracy,
    })),
  );
}

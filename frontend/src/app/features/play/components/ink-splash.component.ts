import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PixelArtComponent } from '../../../shared/components/pixel-art.component';

// The splash is a small pixel picture stretched over the question and the answers:
// '#' is ink and '+' a wet shine on it.
const SPLASH_ROWS = [
  '..........##............',
  '...###...####.......##..',
  '..#####..####......####.',
  '.###+###..##.....#######',
  '.##+#####......####+####',
  '..#########...##########',
  '...##########.#########.',
  '....######+##########...',
  '..#..##############.....',
  '.....############..##...',
  '...######..###+###.###..',
  '..###+####..#####...#...',
  '...######....###........',
  '.....##..........#......',
];

const SPLASH_COLORS = { '#': '#1d1433', '+': '#5d4a9a' };

// INK sabotage: covers part of the question for a few seconds, then fades away.
// It only hides things; the answers under it can still be clicked. The arena banner already
// says who threw the ink, so the splash itself is hidden from screen readers.
@Component({
  selector: 'app-ink-splash',
  imports: [PixelArtComponent],
  templateUrl: './ink-splash.component.html',
  styleUrl: './ink-splash.component.css',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InkSplashComponent {
  readonly active = input.required<boolean>();

  protected readonly rows = SPLASH_ROWS;
  protected readonly colors = SPLASH_COLORS;
}

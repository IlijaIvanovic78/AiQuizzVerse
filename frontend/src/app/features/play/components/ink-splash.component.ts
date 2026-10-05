import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { toPixels } from '../pixel-art';

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
// It only hides things; the answers under it can still be clicked.
@Component({
  selector: 'app-ink-splash',
  template: `
    @if (active()) {
      <div class="splash" role="status" animate.enter="splash-enter" animate.leave="splash-leave">
        <svg
          class="h-full w-full"
          [attr.viewBox]="viewBox"
          preserveAspectRatio="none"
          shape-rendering="crispEdges"
          aria-hidden="true"
        >
          @for (pixel of pixels; track $index) {
            <rect
              [attr.x]="pixel.x"
              [attr.y]="pixel.y"
              width="1"
              height="1"
              [attr.fill]="pixel.color"
            />
          }
        </svg>
        <span class="sr-only">Splat! Someone covered your question with ink.</span>
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: -0.5rem;
      z-index: 2;
      pointer-events: none;
    }

    .splash {
      width: 100%;
      height: 100%;
    }

    .splash-enter {
      animation: splat 260ms ease-out;
    }

    .splash-leave {
      animation: fade-out 600ms ease-in forwards;
    }

    @keyframes splat {
      0% {
        transform: scale(0.4);
        opacity: 0;
      }
      70% {
        transform: scale(1.06);
        opacity: 1;
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes fade-out {
      to {
        opacity: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InkSplashComponent {
  readonly active = input.required<boolean>();

  protected readonly pixels = toPixels(SPLASH_ROWS, SPLASH_COLORS);
  protected readonly viewBox = `0 0 ${SPLASH_ROWS[0].length} ${SPLASH_ROWS.length}`;
}

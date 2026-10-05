import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SabotageType } from '../../../core/models/match.model';
import { toPixels } from '../pixel-art';

interface PixelArt {
  rows: string[];
  colors: Record<string, string>;
}

const OUTLINE = '#0b0814';

const ICONS: Record<SabotageType, PixelArt> = {
  INK: {
    rows: [
      '.....o.....',
      '....ofo....',
      '...offfo...',
      '...offfo...',
      '..offfffo..',
      '.offfffffo.',
      '.ohffffffo.',
      '.ohffffffo.',
      '.offfffffo.',
      '..offfffo..',
      '...ooooo...',
    ],
    colors: { o: OUTLINE, f: '#6b4bc4', h: '#c9b8ff' },
  },
  FREEZE: {
    rows: [
      '.....f.....',
      '.f..fff..f.',
      '..f..f..f..',
      '...f.f.f...',
      '.f..fff..f.',
      'fffffhfffff',
      '.f..fff..f.',
      '...f.f.f...',
      '..f..f..f..',
      '.f..fff..f.',
      '.....f.....',
    ],
    colors: { f: '#9fdcff', h: '#ffffff' },
  },
  SCRAMBLE: {
    rows: [
      '.........f..',
      '.........ff.',
      'fff.....ffff',
      'ffff...fffff',
      '...ff.ff.ff.',
      '....fff..f..',
      '....fff..f..',
      '...ff.ff.ff.',
      'ffff...fffff',
      'fff.....ffff',
      '.........ff.',
      '.........f..',
    ],
    colors: { f: '#ffd37a' },
  },
};

@Component({
  selector: 'app-sabotage-icon',
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      [attr.width]="size()"
      [attr.height]="size()"
      shape-rendering="crispEdges"
      aria-hidden="true"
    >
      @for (pixel of pixels(); track $index) {
        <rect
          [attr.x]="pixel.x"
          [attr.y]="pixel.y"
          width="1"
          height="1"
          [attr.fill]="pixel.color"
        />
      }
    </svg>
  `,
  host: { class: 'inline-flex shrink-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SabotageIconComponent {
  readonly type = input.required<SabotageType>();
  // Screen pixels per art pixel.
  readonly scale = input(2);

  private readonly art = computed(() => ICONS[this.type()]);
  protected readonly viewBox = computed(() => {
    const art = this.art();
    return `0 0 ${art.rows[0].length} ${art.rows.length}`;
  });
  protected readonly size = computed(() => this.art().rows.length * this.scale());
  protected readonly pixels = computed(() => toPixels(this.art().rows, this.art().colors));
}

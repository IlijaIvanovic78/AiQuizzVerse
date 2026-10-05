import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SabotageType } from '../../../core/models/match.model';
import { PixelArtComponent } from './pixel-art.component';

interface IconArt {
  rows: string[];
  colors: Record<string, string>;
}

const OUTLINE = '#0b0814';

const ICONS: Record<SabotageType, IconArt> = {
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
  imports: [PixelArtComponent],
  template: `
    <app-pixel-art
      [rows]="art().rows"
      [colors]="art().colors"
      [style.width.px]="size()"
      [style.height.px]="size()"
    />
  `,
  host: { class: 'inline-flex shrink-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SabotageIconComponent {
  readonly type = input.required<SabotageType>();
  // Screen pixels per art pixel.
  readonly scale = input(2);

  protected readonly art = computed(() => ICONS[this.type()]);
  protected readonly size = computed(() => this.art().rows.length * this.scale());
}

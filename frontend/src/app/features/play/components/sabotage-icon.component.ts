import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SabotageType } from '../../../core/models/match.model';
import { PixelIconComponent, PixelIconName } from '../../../shared/components/pixel-icon.component';
import { PixelArtComponent } from './pixel-art.component';

interface IconArt {
  rows: string[];
  colors: Record<string, string>;
}

// The first three sabotages are drawn here; the newer ones have 16px icons in the assets.
type DrawnSabotage = 'INK' | 'FREEZE' | 'SCRAMBLE';

const ICON_SIZE = 16;
const OUTLINE = '#0b0814';

const ICON_FILES: Record<Exclude<SabotageType, DrawnSabotage>, PixelIconName> = {
  FOG: 'fog',
  QUAKE: 'quake',
  MIRROR: 'mirror',
  SHIELD: 'shield-bubble',
};

const DRAWN_ICONS: Record<DrawnSabotage, IconArt> = {
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

// Every icon takes the same 16px square, so a row of different sabotages lines up.
@Component({
  selector: 'app-sabotage-icon',
  imports: [PixelArtComponent, PixelIconComponent],
  template: `
    @if (art(); as art) {
      <app-pixel-art
        [rows]="art.rows"
        [colors]="art.colors"
        [style.width.px]="art.rows[0].length * scale()"
        [style.height.px]="art.rows.length * scale()"
      />
    } @else if (iconFile(); as file) {
      <app-pixel-icon [name]="file" [scale]="scale()" />
    }
  `,
  host: {
    class: 'inline-flex shrink-0 items-center justify-center',
    '[style.width.px]': 'boxSize()',
    '[style.height.px]': 'boxSize()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SabotageIconComponent {
  readonly type = input.required<SabotageType>();
  // Screen pixels per art pixel.
  readonly scale = input(2);

  protected readonly art = computed(() => {
    const type = this.type();
    return isDrawn(type) ? DRAWN_ICONS[type] : null;
  });
  protected readonly iconFile = computed(() => {
    const type = this.type();
    return isDrawn(type) ? null : ICON_FILES[type];
  });
  protected readonly boxSize = computed(() => ICON_SIZE * this.scale());
}

function isDrawn(type: SabotageType): type is DrawnSabotage {
  return type in DRAWN_ICONS;
}

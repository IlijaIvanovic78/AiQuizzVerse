import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TABLET_UP, screenMatches } from '../media-query';
import { HeroSpriteComponent } from './hero-sprite.component';
import { PetSpriteComponent } from './pet-sprite.component';

const HERO_SCALE = 4;
const WIDE_HERO_SCALE = 5;
const PET_SCALE = 3;
const WIDE_PET_SCALE = 4;
// Sprite frames are 32 pixels wide with the character in the middle, so about 9 pixels on each
// side are empty. The pet steps into that empty space to stand right next to the hero.
const EMPTY_FRAME_SIDE = 9;

@Component({
  selector: 'app-arena-stage',
  imports: [HeroSpriteComponent, PetSpriteComponent],
  template: `
    <div class="spot spot-left">
      <div class="flex items-end" [style.margin-bottom.px]="-heroScale()">
        <app-hero-sprite [heroKey]="heroKey()" [scale]="heroScale()" />
        @if (petKey(); as petKey) {
          <app-pet-sprite
            [petKey]="petKey"
            [scale]="petScale()"
            [style.margin-left.px]="petOffset()"
          />
        }
      </div>
    </div>
    <div class="spot spot-right">
      <ng-content />
    </div>
  `,
  styleUrl: './arena-stage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaStageComponent {
  readonly heroKey = input.required<string | null>();
  readonly petKey = input<string | null>(null);

  private readonly wideScreen = screenMatches(TABLET_UP);

  protected readonly heroScale = computed(() => (this.wideScreen() ? WIDE_HERO_SCALE : HERO_SCALE));
  protected readonly petScale = computed(() => (this.wideScreen() ? WIDE_PET_SCALE : PET_SCALE));
  protected readonly petOffset = computed(
    () => -EMPTY_FRAME_SIDE * (this.heroScale() + this.petScale()),
  );
}

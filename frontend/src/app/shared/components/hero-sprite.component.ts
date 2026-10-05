import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpriteComponent } from './sprite.component';
import { DEFAULT_SPRITE_SCALE } from './sprite-style';

export type HeroAction = 'idle' | 'attack' | 'hurt';

const LUNGE_DISTANCE_PX = 28;

@Component({
  selector: 'app-hero-sprite',
  imports: [SpriteComponent],
  template: `
    <app-sprite
      fallbackName="Hero"
      [spriteKey]="heroKey()"
      [scale]="scale()"
      [flip]="flip()"
      [decorative]="decorative()"
    />
  `,
  host: {
    class: 'inline-block align-bottom',
    '[class.animate-lunge]': "action() === 'attack'",
    '[class.animate-hurt]': "action() === 'hurt'",
    '[style.--lunge-distance]': 'lungeDistance()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSpriteComponent {
  readonly heroKey = input.required<string | null>();
  readonly scale = input(DEFAULT_SPRITE_SCALE);
  readonly action = input<HeroAction>('idle');
  // Flipped heroes face left, like the rivals on the right side of a party.
  readonly flip = input(false);
  readonly decorative = input(false);

  protected readonly lungeDistance = computed(
    () => `${this.flip() ? -LUNGE_DISTANCE_PX : LUNGE_DISTANCE_PX}px`,
  );
}

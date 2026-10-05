import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SpriteManifestService } from '../../core/sprites/sprite-manifest.service';
import { placeholderStyle, spriteStyle } from './sprite-style';

export type HeroAction = 'idle' | 'attack' | 'hurt';

const LUNGE_DISTANCE_PX = 28;

@Component({
  selector: 'app-hero-sprite',
  template: `
    <div
      class="sprite"
      [class.-scale-x-100]="flip()"
      [style]="style()"
      [attr.role]="decorative() ? null : 'img'"
      [attr.aria-label]="decorative() ? null : name()"
      [attr.aria-hidden]="decorative() ? true : null"
    ></div>
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
  private readonly sprites = inject(SpriteManifestService);

  readonly heroKey = input.required<string | null>();
  readonly scale = input(4);
  readonly action = input<HeroAction>('idle');
  // Flipped heroes face left, like the opponent in a duel.
  readonly flip = input(false);
  readonly decorative = input(false);

  private readonly sprite = computed(() => this.sprites.getSprite(this.heroKey()));

  protected readonly name = computed(() => this.sprite()?.name ?? 'Hero');
  protected readonly lungeDistance = computed(
    () => `${this.flip() ? -LUNGE_DISTANCE_PX : LUNGE_DISTANCE_PX}px`,
  );
  protected readonly style = computed(() => {
    const sprite = this.sprite();
    if (!sprite) {
      return placeholderStyle(this.scale());
    }
    return spriteStyle(sprite, this.sprites.sheetUrl(sprite), this.scale());
  });
}

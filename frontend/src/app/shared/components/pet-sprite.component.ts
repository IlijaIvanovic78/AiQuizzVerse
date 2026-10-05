import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpriteComponent } from './sprite.component';
import { DEFAULT_SPRITE_SCALE } from './sprite-style';

@Component({
  selector: 'app-pet-sprite',
  imports: [SpriteComponent],
  template: `
    <app-sprite
      fallbackName="Pet"
      [spriteKey]="petKey()"
      [scale]="scale()"
      [flip]="flip()"
      [decorative]="decorative()"
    />
  `,
  host: { class: 'inline-block align-bottom' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetSpriteComponent {
  readonly petKey = input.required<string | null>();
  readonly scale = input(DEFAULT_SPRITE_SCALE);
  readonly flip = input(false);
  readonly decorative = input(false);
}

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SpriteManifestService } from '../../core/sprites/sprite-manifest.service';
import { placeholderStyle, spriteStyle } from './sprite-style';

@Component({
  selector: 'app-pet-sprite',
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
  host: { class: 'inline-block align-bottom' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetSpriteComponent {
  private readonly sprites = inject(SpriteManifestService);

  readonly petKey = input.required<string | null>();
  readonly scale = input(4);
  readonly flip = input(false);
  readonly decorative = input(false);

  private readonly sprite = computed(() => this.sprites.getSprite(this.petKey()));

  protected readonly name = computed(() => this.sprite()?.name ?? 'Pet');
  protected readonly style = computed(() => {
    const sprite = this.sprite();
    if (!sprite) {
      return placeholderStyle(this.scale());
    }
    return spriteStyle(sprite, this.sprites.sheetUrl(sprite), this.scale());
  });
}

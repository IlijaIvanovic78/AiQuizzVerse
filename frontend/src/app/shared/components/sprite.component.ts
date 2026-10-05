import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SpriteManifestService } from '../../core/sprites/sprite-manifest.service';
import { placeholderStyle, spriteStyle } from './sprite-style';

// One animated character from the sprite manifest, used by HeroSpriteComponent and
// PetSpriteComponent. The fallback name is read out while the manifest is still loading.
@Component({
  selector: 'app-sprite',
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
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpriteComponent {
  private readonly sprites = inject(SpriteManifestService);

  readonly spriteKey = input.required<string | null>();
  readonly fallbackName = input.required<string>();
  readonly scale = input.required<number>();
  readonly flip = input(false);
  readonly decorative = input(false);

  private readonly sprite = computed(() => this.sprites.getSprite(this.spriteKey()));

  protected readonly name = computed(() => this.sprite()?.name ?? this.fallbackName());
  protected readonly style = computed(() => {
    const sprite = this.sprite();
    if (!sprite) {
      return placeholderStyle(this.scale());
    }
    return spriteStyle(sprite, this.sprites.sheetUrl(sprite), this.scale());
  });
}

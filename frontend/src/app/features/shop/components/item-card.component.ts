import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ShopItem } from '../../../core/models/shop.model';
import { CoinAmountComponent } from '../../../shared/components/coin-amount.component';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PetSpriteComponent } from '../../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { itemState } from '../item-state';

@Component({
  selector: 'app-item-card',
  imports: [CoinAmountComponent, HeroSpriteComponent, PetSpriteComponent, PixelIconComponent],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.css',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemCardComponent {
  readonly item = input.required<ShopItem>();
  readonly level = input.required<number>();
  readonly coins = input.required<number>();
  readonly busy = input(false);
  readonly buy = output<ShopItem>();
  readonly equip = output<ShopItem>();
  readonly unequip = output<void>();

  protected readonly state = computed(() => itemState(this.item(), this.level(), this.coins()));
  protected readonly isHero = computed(() => this.item().type === 'AVATAR');
  protected readonly coinsMissing = computed(() => this.item().price - this.coins());
}

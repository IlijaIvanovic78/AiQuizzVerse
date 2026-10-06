import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShopItem } from '../../../core/models/shop.model';
import { CoinAmountComponent } from '../../../shared/components/coin-amount.component';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PetSpriteComponent } from '../../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SabotageIconComponent } from '../../../shared/components/sabotage-icon.component';
import { sabotageOfItem } from '../../../shared/sabotages';
import { itemState } from '../item-state';
import { FREE_INK } from '../shop.constants';

@Component({
  selector: 'app-item-card',
  imports: [
    RouterLink,
    CoinAmountComponent,
    HeroSpriteComponent,
    PetSpriteComponent,
    PixelIconComponent,
    SabotageIconComponent,
  ],
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
  protected readonly sabotageType = computed(() => sabotageOfItem(this.item()));
  // Ink is the one sabotage every player starts with.
  protected readonly isFreeSabotage = computed(() => this.item().id === FREE_INK.id);
  protected readonly coinsMissing = computed(() => this.item().price - this.coins());
}

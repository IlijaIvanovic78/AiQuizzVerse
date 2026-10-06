import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ChestReward } from '../../../core/models/chest.model';
import { ShopItem } from '../../../core/models/shop.model';
import { BOOST_LABELS } from '../../../shared/boosts';
import { BoostIconComponent } from '../../../shared/components/boost-icon.component';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PetSpriteComponent } from '../../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SabotageIconComponent } from '../../../shared/components/sabotage-icon.component';
import { sabotageOfItem } from '../../../shared/sabotages';

// What came out of a chest: coins, power-ups, a hero or pet shown as its animated sprite,
// or a new sabotage for party matches.
@Component({
  selector: 'app-chest-reward',
  imports: [
    BoostIconComponent,
    HeroSpriteComponent,
    PetSpriteComponent,
    PixelIconComponent,
    SabotageIconComponent,
  ],
  templateUrl: './chest-reward.component.html',
  styleUrl: './chest-reward.component.css',
  host: { class: 'flex flex-col items-center gap-2 text-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChestRewardComponent {
  readonly reward = input.required<ChestReward>();
  // The found hero or pet is already the one the player wears.
  readonly equipped = input(false);
  readonly equip = output<ShopItem>();

  protected readonly boostLabels = BOOST_LABELS;
  protected readonly sabotageOfItem = sabotageOfItem;
}

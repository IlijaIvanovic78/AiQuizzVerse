import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ChestView } from '../../core/models/chest.model';
import { ShopItem } from '../../core/models/shop.model';
import { CHEST_ICONS, CHEST_NAMES } from '../../shared/chests';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { authFeature } from '../../store/auth/auth.reducer';
import { ChestsActions } from '../../store/chests/chests.actions';
import { chestsFeature } from '../../store/chests/chests.reducer';
import { EquipmentActions } from '../../store/shop/equipment.actions';
import { shopFeature } from '../../store/shop/shop.reducer';
import { HOW_TO_EARN } from './chests.constants';
import { ChestCardComponent } from './components/chest-card.component';
import { ChestOddsComponent } from './components/chest-odds.component';
import { ChestOpeningComponent } from './components/chest-opening.component';
import { RecentRewardsComponent } from './components/recent-rewards.component';

// The treasure room: the chests waiting to be opened, what came out of the last ones,
// how to earn more and the honest chances of every reward.
@Component({
  selector: 'app-chests-page',
  imports: [
    RouterLink,
    EmptyStateComponent,
    PageHeaderComponent,
    PixelIconComponent,
    SpinnerComponent,
    ChestCardComponent,
    ChestOddsComponent,
    ChestOpeningComponent,
    RecentRewardsComponent,
  ],
  templateUrl: './chests-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChestsPageComponent {
  private readonly store = inject(Store);

  protected readonly unopened = this.store.selectSignal(chestsFeature.selectUnopenedChests);
  protected readonly recent = this.store.selectSignal(chestsFeature.selectRecent);
  protected readonly odds = this.store.selectSignal(chestsFeature.selectOdds);
  protected readonly loaded = this.store.selectSignal(chestsFeature.selectLoaded);
  protected readonly opening = this.store.selectSignal(chestsFeature.selectOpening);
  protected readonly reveal = this.store.selectSignal(chestsFeature.selectReveal);
  // The shop slice is busy while the found hero or pet is being equipped.
  protected readonly equipping = this.store.selectSignal(shopFeature.selectBusy);
  private readonly user = this.store.selectSignal(authFeature.selectUser);

  protected readonly howToEarn = HOW_TO_EARN;
  protected readonly chestIcons = CHEST_ICONS;
  protected readonly chestNames = CHEST_NAMES;

  // "Open all" goes through the chests one by one, each with its own reveal.
  protected readonly openingAll = signal(false);
  protected readonly nextCount = computed(() => (this.openingAll() ? this.unopened().length : 0));
  protected readonly rewardEquipped = computed(() => {
    const itemId = this.reveal()?.item?.id;
    const user = this.user();
    return itemId !== undefined && (user?.avatarKey === itemId || user?.petKey === itemId);
  });

  constructor() {
    this.store.dispatch(ChestsActions.load());
    this.store.dispatch(ChestsActions.loadOdds());
  }

  protected open(chest: ChestView): void {
    this.openingAll.set(false);
    this.store.dispatch(ChestsActions.open({ chestId: chest.id }));
  }

  protected openAll(): void {
    this.openingAll.set(true);
    this.openNext();
  }

  protected openNext(): void {
    const [next] = this.unopened();
    if (next) {
      this.store.dispatch(ChestsActions.open({ chestId: next.id }));
    }
  }

  protected closeReveal(): void {
    this.openingAll.set(false);
    this.store.dispatch(ChestsActions.revealClosed());
  }

  protected equip(item: ShopItem): void {
    this.store.dispatch(EquipmentActions.equipItem({ itemId: item.id }));
  }
}

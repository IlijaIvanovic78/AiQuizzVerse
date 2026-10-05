import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CoinPackage } from '../../core/models/payment.model';
import { BoostOffer, ShopItem } from '../../core/models/shop.model';
import { BoostIconComponent } from '../../shared/components/boost-icon.component';
import { CoinAmountComponent } from '../../shared/components/coin-amount.component';
import { HeroSpriteComponent } from '../../shared/components/hero-sprite.component';
import { LevelBadgeComponent } from '../../shared/components/level-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { PetSpriteComponent } from '../../shared/components/pet-sprite.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { SabotageIconComponent } from '../../shared/components/sabotage-icon.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { sabotageOfItem } from '../../shared/sabotages';
import { authFeature } from '../../store/auth/auth.reducer';
import { FREE_HINTS_PER_MATCH } from '../../store/match/match.constants';
import { PaymentsActions } from '../../store/shop/payments.actions';
import { ShopActions } from '../../store/shop/shop.actions';
import { shopFeature } from '../../store/shop/shop.reducer';
import { BoostCardComponent } from './components/boost-card.component';
import { BuyDialogComponent } from './components/buy-dialog.component';
import { CoinPackCardComponent } from './components/coin-pack-card.component';
import { GrownUpGateComponent } from './components/grown-up-gate.component';
import { ItemCardComponent } from './components/item-card.component';
import { isShownInShop } from './item-state';
import { FREE_INK, ITEM_TABS, MONTHLY_LIMIT_CENTS, SHOP_TABS, ShopTab } from './shop.constants';

const TAB_KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

@Component({
  selector: 'app-shop-page',
  imports: [
    NgTemplateOutlet,
    PricePipe,
    RouterLink,
    BoostIconComponent,
    CoinAmountComponent,
    HeroSpriteComponent,
    LevelBadgeComponent,
    PageHeaderComponent,
    PetSpriteComponent,
    PixelIconComponent,
    SabotageIconComponent,
    SpinnerComponent,
    BoostCardComponent,
    BuyDialogComponent,
    CoinPackCardComponent,
    GrownUpGateComponent,
    ItemCardComponent,
  ],
  templateUrl: './shop-page.component.html',
  styleUrl: './shop-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopPageComponent {
  private readonly store = inject(Store);
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  protected readonly tabs = SHOP_TABS;
  protected readonly activeTab = signal<ShopTab>('heroes');
  protected readonly monthlyLimitCents = MONTHLY_LIMIT_CENTS;
  protected readonly freeHints = FREE_HINTS_PER_MATCH;
  protected readonly sabotageOfItem = sabotageOfItem;

  private readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly coins = this.store.selectSignal(authFeature.selectCoins);
  protected readonly level = computed(() => this.user()?.level ?? 1);

  private readonly allHeroes = this.store.selectSignal(shopFeature.selectHeroItems);
  protected readonly heroes = computed(() => this.allHeroes().filter(isShownInShop));
  protected readonly pets = this.store.selectSignal(shopFeature.selectPetItems);
  private readonly soldSabotages = this.store.selectSignal(shopFeature.selectSabotageItems);
  protected readonly sabotages = computed(() => [FREE_INK, ...this.soldSabotages()]);
  protected readonly showsItems = computed(() => ITEM_TABS.includes(this.activeTab()));
  protected readonly shelfItems = computed(() => {
    const tab = this.activeTab();
    if (tab === 'pets') {
      return this.pets();
    }
    return tab === 'sabotages' ? this.sabotages() : this.heroes();
  });
  protected readonly boosts = this.store.selectSignal(shopFeature.selectBoosts);
  protected readonly packages = this.store.selectSignal(shopFeature.selectPackages);
  protected readonly itemsLoaded = this.store.selectSignal(shopFeature.selectItemsLoaded);
  protected readonly busy = this.store.selectSignal(shopFeature.selectBusy);
  protected readonly error = this.store.selectSignal(shopFeature.selectError);

  protected readonly itemToBuy = signal<ShopItem | null>(null);
  protected readonly boostToBuy = signal<BoostOffer | null>(null);
  protected readonly packToBuy = signal<CoinPackage | null>(null);

  constructor() {
    this.loadShop();
  }

  // Owned counts change after every match, so the shop asks the server again on each visit.
  protected loadShop(): void {
    this.store.dispatch(ShopActions.loadItems());
    this.store.dispatch(ShopActions.loadBoosts());
    this.store.dispatch(PaymentsActions.loadPackages());
  }

  protected selectTab(tab: ShopTab): void {
    this.activeTab.set(tab);
  }

  // Arrow keys move between tabs, as screen reader users expect from a tab list.
  protected moveTab(event: KeyboardEvent, index: number): void {
    const step = TAB_KEY_STEPS[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    const nextIndex = (index + step + this.tabs.length) % this.tabs.length;
    this.activeTab.set(this.tabs[nextIndex].id);
    this.tabButtons()[nextIndex].nativeElement.focus();
  }

  protected buyItem(): void {
    const item = this.itemToBuy();
    if (item) {
      this.store.dispatch(ShopActions.buyItem({ itemId: item.id }));
    }
    this.itemToBuy.set(null);
  }

  protected buyBoost(): void {
    const boost = this.boostToBuy();
    if (boost) {
      this.store.dispatch(ShopActions.buyBoost({ boostType: boost.type }));
    }
    this.boostToBuy.set(null);
  }

  protected equip(item: ShopItem): void {
    this.store.dispatch(ShopActions.equipItem({ itemId: item.id }));
  }

  protected unequipPet(): void {
    this.store.dispatch(ShopActions.unequipPet());
  }

  protected openCheckout(pack: CoinPackage): void {
    this.store.dispatch(PaymentsActions.checkout({ packageId: pack.id }));
  }
}

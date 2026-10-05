import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { HeroSpriteComponent } from '../../shared/components/hero-sprite.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { AuthActions } from '../../store/auth/auth.actions';
import { ShopActions } from '../../store/shop/shop.actions';
import { shopFeature } from '../../store/shop/shop.reducer';
import { AuthLayoutComponent } from './components/auth-layout.component';

const STARTER_TAGLINES: Record<string, string> = {
  'mini-sword-man': 'Brave and steady. Never gives up on a hard question.',
  'mini-archer-man': 'Sharp eyes. Spots the right answer from far away.',
  'mini-mage': 'Curious and clever. Loves learning new things.',
};

@Component({
  selector: 'app-welcome-page',
  imports: [AuthLayoutComponent, HeroSpriteComponent, PixelIconComponent, SpinnerComponent],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePageComponent {
  private readonly store = inject(Store);

  protected readonly selectedId = signal<string | null>(null);
  protected readonly loading = this.store.selectSignal(shopFeature.selectLoading);
  protected readonly busy = this.store.selectSignal(shopFeature.selectBusy);
  private readonly starters = this.store.selectSignal(shopFeature.selectStarterItems);

  protected readonly heroes = computed(() =>
    this.starters().map((item) => ({
      id: item.id,
      name: item.name,
      tagline: STARTER_TAGLINES[item.id] ?? '',
    })),
  );
  protected readonly selectedName = computed(
    () => this.heroes().find((hero) => hero.id === this.selectedId())?.name ?? null,
  );

  constructor() {
    this.loadHeroes();
  }

  protected loadHeroes(): void {
    this.store.dispatch(ShopActions.loadItems());
  }

  protected select(heroId: string): void {
    this.selectedId.set(heroId);
  }

  protected claim(): void {
    const heroId = this.selectedId();
    if (heroId) {
      this.store.dispatch(ShopActions.claimStarter({ itemId: heroId }));
    }
  }

  protected logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

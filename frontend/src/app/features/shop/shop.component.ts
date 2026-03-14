import { Component, OnInit, inject, signal, computed, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { ShopActions, selectShopItems, selectShopBoosts, selectShopLoading } from '../../store/shop';
import { selectUser } from '../../store/auth/auth.selectors';
import { selectAllUserItems, selectUserPets } from '../../store/avatar/avatar.selectors';
import { AvatarActions } from '../../store/avatar/avatar.actions';
import { BoostType, ShopItem } from '../../models';
import { SpriteAnimatorComponent } from '../../shared/components/sprite-animator/sprite-animator.component';
import { FormatCoinsPipe } from '../../shared/pipes/format-coins.pipe';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

const BOOST_INFO: { type: BoostType; label: string; desc: string; price: number; icon: string }[] = [
  { type: 'HINT', label: 'Hint', desc: 'Reveals a hint', price: 20, icon: '💡' },
  { type: 'EXTRA_TIME', label: 'Extra Time', desc: '+10 seconds', price: 15, icon: '⏰' },
  { type: 'FIFTY_FIFTY', label: '50/50', desc: 'Remove 2 wrong answers', price: 25, icon: '✂️' },
  { type: 'DOUBLE_POINTS', label: 'Double Points', desc: '2x points', price: 30, icon: '⭐' },
  { type: 'SHIELD', label: 'Shield', desc: 'No point loss on wrong', price: 35, icon: '🛡️' },
  { type: 'STREAK_FREEZE', label: 'Streak Freeze', desc: 'Keeps win streak', price: 40, icon: '❄️' },
];

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, SpriteAnimatorComponent, FormatCoinsPipe],
  template: `
    <div class="p-6 max-w-6xl mx-auto">
      <h1 class="font-pixel text-3xl text-primary-400 mb-2">Shop</h1>
      <p class="font-retro text-dark-400 mb-6">Your coins: <span class="text-accent-400 font-bold">{{ ((user$ | async)?.coins || 0) | formatCoins }}</span>
        <svg class="w-5 h-5 text-accent-400 inline-block ml-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
        </svg>
      </p>

      <!-- Tab selector -->
      <div class="flex gap-2 mb-6">
        <button (click)="tab = 'avatars'" class="px-4 py-2 rounded-lg font-retro text-sm transition-colors"
                [class]="tab === 'avatars' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400 hover:text-white'">
          Avatars
        </button>
        <button (click)="tab = 'pets'" class="px-4 py-2 rounded-lg font-retro text-sm transition-colors"
                [class]="tab === 'pets' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400 hover:text-white'">
          Pets
        </button>
        <button (click)="tab = 'boosts'" class="px-4 py-2 rounded-lg font-retro text-sm transition-colors"
                [class]="tab === 'boosts' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400 hover:text-white'">
          Boosts
        </button>
      </div>

      <!-- Avatars tab -->
      @if (tab === 'avatars') {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @for (item of getAvatars(items$ | async); track item.id) {
            @let owned = isOwned(item.id);
            <div class="bg-dark-800 rounded-xl p-4 border transition-all group" [class]="owned ? 'border-green-500/30 opacity-70' : 'border-dark-600 hover:border-primary-500'">
              <div class="w-full aspect-square bg-dark-700/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <app-sprite-animator [characterId]="item.imagePath" [displaySize]="140"></app-sprite-animator>
              </div>
              <h3 class="font-retro text-white text-sm truncate">{{ item.name }}</h3>
              <div class="flex items-center justify-between mt-2">
                @if (item.price === 0) {
                  <span class="text-green-400 font-bold text-sm">FREE</span>
                } @else {
                  <span class="text-accent-400 font-bold text-sm flex items-center gap-1">{{ item.price }} <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" /></svg></span>
                }
                @if (item.minLevel > 1) {
                  <span class="text-xs text-dark-500 font-retro">Lv.{{ item.minLevel }}</span>
                }
              </div>
              @if (owned) {
                <div class="mt-3 w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-retro text-center">
                  ✓ Owned
                </div>
              } @else {
                <button (click)="confirmBuyItem(item)"
                        class="mt-3 w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-retro transition-colors"
                        [disabled]="(loading$ | async)">
                  Buy
                </button>
              }
            </div>
          }
        </div>
      }

      <!-- Pets tab -->
      @if (tab === 'pets') {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @for (item of getPets(items$ | async); track item.id) {
            @let owned = isOwned(item.id);
            <div class="bg-dark-800 rounded-xl p-4 border transition-all group" [class]="owned ? 'border-green-500/30 opacity-70' : 'border-dark-600 hover:border-primary-500'">
              <div class="w-full aspect-square bg-dark-700/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <app-sprite-animator [characterId]="item.imagePath" [displaySize]="140"></app-sprite-animator>
              </div>
              <h3 class="font-retro text-white text-sm truncate">{{ item.name }}</h3>
              <div class="flex items-center justify-between mt-2">
                <span class="text-accent-400 font-bold text-sm flex items-center gap-1">{{ item.price }} <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" /></svg></span>
                @if (item.minLevel > 1) {
                  <span class="text-xs text-dark-500 font-retro">Lv.{{ item.minLevel }}</span>
                }
              </div>
              @if (owned) {
                <div class="mt-3 w-full py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-retro text-center">
                  ✓ Owned
                </div>
              } @else {
                <button (click)="confirmBuyItem(item)"
                        class="mt-3 w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-retro transition-colors"
                        [disabled]="(loading$ | async)">
                  Buy
                </button>
              }
            </div>
          }
        </div>
      }

      <!-- Boosts tab -->
      @if (tab === 'boosts') {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          @for (boost of boostInfo; track boost.type) {
            @let owned = getBoostCount(boosts$ | async, boost.type);
            <div class="bg-dark-800 rounded-xl p-5 border border-dark-600 hover:border-primary-500 transition-colors">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-3xl">{{ boost.icon }}</span>
                <div>
                  <h3 class="font-retro text-white font-medium">{{ boost.label }}</h3>
                  <p class="font-retro text-dark-400 text-sm">{{ boost.desc }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between mt-3">
                <span class="text-accent-400 font-bold flex items-center gap-1">{{ boost.price }} <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" /></svg></span>
                <span class="font-retro text-dark-400 text-sm">Owned: {{ owned }}</span>
              </div>
              <button (click)="confirmBuyBoost(boost)"
                      class="mt-3 w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-retro transition-colors"
                      [disabled]="(loading$ | async)">
                Buy
              </button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Confirmation dialog -->
    @if (confirmDialog()) {
      <div class="fixed inset-0 z-[200] flex items-center justify-center bg-dark-900/80 backdrop-blur-sm">
        <div class="bg-dark-800 border-2 border-primary-700/50 rounded-2xl p-6 max-w-sm mx-4 shadow-glow-purple-sm">
          <h3 class="font-pixel text-xl text-primary-400 mb-3 text-center">Confirm Purchase</h3>
          <p class="font-retro text-dark-300 text-sm text-center mb-3">
            Are you sure you want to buy <span class="text-white font-bold">{{ confirmDialog()!.name }}</span>
            for <span class="text-accent-400 font-bold">{{ confirmDialog()!.price }} <svg class="w-4 h-4 inline -mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" /></svg></span>?
          </p>
          @if (confirmError(); as err) {
            <div class="mb-3 p-2.5 bg-red-900/30 border border-red-500/40 rounded-lg">
              <p class="font-retro text-sm text-red-400 text-center">{{ err }}</p>
            </div>
          }
          <div class="flex gap-3">
            <button (click)="cancelPurchase()" class="flex-1 py-2.5 rounded-lg bg-dark-600 hover:bg-dark-500 text-dark-300 font-retro text-sm transition-colors"
                    [disabled]="confirmLoading()">
              Cancel
            </button>
            <button (click)="executePurchase()" class="flex-1 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-retro text-sm transition-colors"
                    [disabled]="confirmLoading()">
              {{ confirmLoading() ? 'Buying...' : 'Buy Now' }}
            </button>
          </div>
        </div>
      </div>
    }


  `,
})
export class ShopComponent implements OnInit, OnChanges {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);

  /** Set of valid sprite IDs from the manifest */
  private validSpriteIds = signal(new Set<string>());

  items$ = this.store.select(selectShopItems);
  boosts$ = this.store.select(selectShopBoosts);
  loading$ = this.store.select(selectShopLoading);
  user$ = this.store.select(selectUser);

  // Track owned items to show "Owned" badge
  private ownedAvatars = toSignal(this.store.select(selectAllUserItems), { initialValue: [] });
  private ownedPets = toSignal(this.store.select(selectUserPets), { initialValue: [] });
  private ownedItemIds = computed(() => {
    const ids = new Set<string>();
    this.ownedAvatars().forEach(ui => ids.add(ui.itemId));
    this.ownedPets().forEach(ui => ids.add(ui.itemId));
    return ids;
  });

  @Input() initialTab: 'avatars' | 'pets' | 'boosts' = 'avatars';

  tab: 'avatars' | 'pets' | 'boosts' = 'avatars';
  boostInfo = BOOST_INFO;

  confirmDialog = signal<{ name: string; price: number; action: () => void } | null>(null);
  confirmError = signal<string | null>(null);
  confirmLoading = signal(false);


  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialTab']) {
      this.tab = this.initialTab;
    }
  }

  ngOnInit() {
    this.tab = this.initialTab;
    this.store.dispatch(ShopActions.loadItems());
    this.store.dispatch(ShopActions.loadBoosts());
    this.store.dispatch(AvatarActions.loadItems());
    this.store.dispatch(AvatarActions.loadPets());

    this.http.get<{ id: string }[]>('/assets/avatars/manifest.json').subscribe(manifest => {
      this.validSpriteIds.set(new Set(manifest.map(e => e.id)));
    });
  }

  getAvatars(items: ShopItem[] | null): ShopItem[] {
    const valid = this.validSpriteIds();
    return (items || []).filter((i) => i.type === 'AVATAR' && (valid.size === 0 || valid.has(i.imagePath)));
  }

  getPets(items: ShopItem[] | null): ShopItem[] {
    const valid = this.validSpriteIds();
    return (items || []).filter((i) => i.type === 'PET' && (valid.size === 0 || valid.has(i.imagePath)));
  }

  isOwned(itemId: string): boolean {
    return this.ownedItemIds().has(itemId);
  }

  getBoostCount(boosts: any[] | null, type: BoostType): number {
    return (boosts || []).find((b: any) => b.type === type)?.quantity || 0;
  }

  confirmBuyItem(item: ShopItem) {
    this.confirmError.set(null);
    this.confirmDialog.set({
      name: item.name,
      price: item.price,
      action: () => {
        this.confirmLoading.set(true);
        this.confirmError.set(null);
        this.store.dispatch(ShopActions.buyItem({ itemId: item.id }));

        // Listen for success/failure
        this.actions$.pipe(
          ofType(ShopActions.buyItemSuccess, ShopActions.buyItemFailure),
          take(1),
        ).subscribe((result) => {
          this.confirmLoading.set(false);
          if (result.type === ShopActions.buyItemSuccess.type) {
            this.confirmDialog.set(null);
            // Reload shop items and user's owned avatars
            this.store.dispatch(ShopActions.loadItems());
            this.store.dispatch(AvatarActions.loadItems());
            this.store.dispatch(AvatarActions.loadPets());
          } else {
            this.confirmError.set((result as any).error || 'Purchase failed');
          }
        });
      },
    });
  }

  confirmBuyBoost(boost: { type: BoostType; label: string; price: number; icon: string }) {
    this.confirmError.set(null);
    this.confirmDialog.set({
      name: boost.label,
      price: boost.price,
      action: () => {
        this.confirmLoading.set(true);
        this.confirmError.set(null);
        this.store.dispatch(ShopActions.buyBoost({ boostType: boost.type }));

        this.actions$.pipe(
          ofType(ShopActions.buyBoostSuccess, ShopActions.buyBoostFailure),
          take(1),
        ).subscribe((result) => {
          this.confirmLoading.set(false);
          if (result.type === ShopActions.buyBoostSuccess.type) {
            this.confirmDialog.set(null);
            this.store.dispatch(ShopActions.loadBoosts());
          } else {
            this.confirmError.set((result as any).error || 'Purchase failed');
          }
        });
      },
    });
  }

  cancelPurchase() {
    this.confirmDialog.set(null);
    this.confirmError.set(null);
    this.confirmLoading.set(false);
  }

  executePurchase() {
    const dialog = this.confirmDialog();
    if (dialog) {
      dialog.action();
      // Dialog stays open — closed by success handler or user can cancel on error
    }
  }


}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { ShopActions, selectShopBoosts } from '../../../store/shop';
import { BoostType } from '../../../models';

const BOOST_META: Record<string, { label: string; icon: string; desc: string }> = {
  HINT: { label: 'Hint', icon: '💡', desc: 'Reveals a hint' },
  EXTRA_TIME: { label: 'Extra Time', icon: '⏰', desc: '+10 seconds' },
  FIFTY_FIFTY: { label: '50/50', icon: '✂️', desc: 'Remove 2 wrong answers' },
  DOUBLE_POINTS: { label: 'Double Points', icon: '⭐', desc: '2x points' },
  SHIELD: { label: 'Shield', icon: '🛡️', desc: 'No point loss on wrong' },
  STREAK_FREEZE: { label: 'Streak Freeze', icon: '❄️', desc: 'Keeps win streak' },
};

@Component({
  selector: 'app-boosts-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-dark-800/40 border border-primary-700/20 rounded-xl p-5">
      <h3 class="font-pixel text-base text-primary-400 mb-4 flex items-center gap-2">
        <span class="text-lg">⚡</span>
        My Boosts
      </h3>

      @if (boosts$ | async; as boosts) {
        @if (boosts.length === 0) {
          <p class="font-retro text-dark-400 text-sm">No boosts yet. Buy some in the Shop!</p>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (boost of boosts; track boost.type) {
              <div class="bg-dark-700/40 border border-dark-600 rounded-lg p-3 flex items-center gap-3">
                <span class="text-2xl">{{ getMeta(boost.type).icon }}</span>
                <div class="min-w-0 flex-1">
                  <p class="font-retro text-white text-sm truncate">{{ getMeta(boost.type).label }}</p>
                  <p class="font-retro text-dark-400 text-[10px]">{{ getMeta(boost.type).desc }}</p>
                </div>
                <span class="font-pixel text-accent-400 text-lg">{{ boost.quantity }}</span>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class BoostsOverviewComponent implements OnInit {
  private readonly store = inject(Store);

  boosts$ = this.store.select(selectShopBoosts);

  ngOnInit() {
    this.store.dispatch(ShopActions.loadBoosts());
  }

  getMeta(type: BoostType) {
    return BOOST_META[type] || { label: type, icon: '❓', desc: '' };
  }
}

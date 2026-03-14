import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
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
    <div class="bg-dark-800/40 border border-primary-700/20 rounded-xl p-4 h-full flex flex-col">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-pixel text-sm text-primary-400 flex items-center gap-2">
          <span class="text-base">⚡</span>
          My Boosts
        </h3>
        <button (click)="shopClick.emit()" class="w-6 h-6 rounded bg-primary-500/20 border border-primary-500/40 flex items-center justify-center hover:bg-primary-500/40 transition-colors" title="Buy Boosts">
          <svg class="w-3.5 h-3.5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      @if (boosts$ | async; as boosts) {
        @if (boosts.length === 0) {
          <p class="font-retro text-dark-400 text-xs">No boosts yet. Buy some in the Shop!</p>
        } @else {
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 flex-1">
            @for (boost of boosts; track boost.type) {
              <div class="bg-dark-700/40 border border-dark-600 rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 text-center" [title]="getMeta(boost.type).desc">
                <span class="text-2xl leading-none">{{ getMeta(boost.type).icon }}</span>
                <p class="font-retro text-dark-300 text-[10px] truncate w-full">{{ getMeta(boost.type).label }}</p>
                <span class="font-pixel text-accent-400 text-sm leading-none">×{{ boost.quantity }}</span>
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

  @Output() shopClick = new EventEmitter<void>();

  boosts$ = this.store.select(selectShopBoosts);

  ngOnInit() {
    this.store.dispatch(ShopActions.loadBoosts());
  }

  getMeta(type: BoostType) {
    return BOOST_META[type] || { label: type, icon: '❓', desc: '' };
  }
}

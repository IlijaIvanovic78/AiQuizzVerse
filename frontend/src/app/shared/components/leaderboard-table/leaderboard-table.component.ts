import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardEntry } from '../../../models/leaderboard.model';
import { AvatarDisplayComponent } from '../avatar-display/avatar-display.component';

@Component({
  selector: 'app-leaderboard-table',
  standalone: true,
  imports: [CommonModule, AvatarDisplayComponent],
  template: `
    <div class="bg-dark-800/80 border border-dark-600 rounded-xl overflow-hidden">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-dark-600 flex items-center gap-2">
        <span class="text-lg">{{ icon }}</span>
        <h3 class="font-pixel text-sm text-gray-200 uppercase tracking-wider">{{ title }}</h3>
      </div>

      <!-- Table -->
      <div class="max-h-[340px] overflow-y-auto">
        @if (entries.length === 0) {
          <div class="px-4 py-8 text-center text-gray-500 text-sm">No data yet</div>
        } @else {
          @for (entry of entries; track entry.id; let i = $index) {
            <div
              class="flex items-center gap-3 px-4 py-2.5 border-b border-dark-700/50 transition-colors"
              [ngClass]="{
                'bg-primary-500/10 border-l-2 border-l-primary-500': entry.id === currentUserId,
                'hover:bg-dark-700/40': entry.id !== currentUserId
              }">
              <!-- Rank -->
              <div class="w-8 text-center flex-shrink-0">
                @if (i === 0) {
                  <span class="text-lg">🥇</span>
                } @else if (i === 1) {
                  <span class="text-lg">🥈</span>
                } @else if (i === 2) {
                  <span class="text-lg">🥉</span>
                } @else {
                  <span class="font-pixel text-xs text-gray-500">#{{ i + 1 }}</span>
                }
              </div>

              <!-- Avatar -->
              <app-avatar-display [avatarUrl]="entry.avatarUrl" [size]="32" [ring]="false"></app-avatar-display>

              <!-- Name + Level -->
              <div class="flex-1 min-w-0">
                <div class="font-pixel text-xs text-gray-200 truncate">{{ entry.username }}</div>
                <div class="text-xs text-gray-500">Lv.{{ entry.level }}</div>
              </div>

              <!-- XP -->
              <div class="text-right flex-shrink-0">
                <div class="font-pixel text-xs text-primary-400">{{ entry.xp | number }}</div>
                <div class="text-xs text-gray-500">XP</div>
              </div>

              <!-- Streak -->
              @if (entry.streak > 0) {
                <div class="flex-shrink-0 flex items-center gap-1 bg-dark-700/50 rounded px-1.5 py-0.5">
                  <span class="text-xs">🔥</span>
                  <span class="font-pixel text-xs text-orange-400">{{ entry.streak }}</span>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class LeaderboardTableComponent {
  @Input() title = 'Leaderboard';
  @Input() icon = '🏆';
  @Input() entries: LeaderboardEntry[] = [];
  @Input() currentUserId: string | null = null;
}

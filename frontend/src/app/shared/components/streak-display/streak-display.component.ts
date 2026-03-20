import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-streak-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-4 bg-dark-800/80 border border-dark-600 rounded-xl px-5 py-3">
      <!-- Fire icon + streak count -->
      <div class="flex items-center gap-2">
        <span class="text-3xl" [class.animate-pulse]="streak >= 3">🔥</span>
        <span class="font-pixel text-2xl" [ngClass]="streak >= 7 ? 'text-accent-400' : streak >= 3 ? 'text-orange-400' : 'text-gray-300'">
          {{ streak }}
        </span>
      </div>

      <!-- Label -->
      <div class="flex flex-col leading-tight">
        <span class="font-pixel text-xs text-gray-400 uppercase tracking-wider">Day Streak</span>
        @if (streak >= 3) {
          <span class="text-xs text-orange-400/80">+{{ streakBonus }} bonus coins/match</span>
        }
      </div>

      <!-- Best badge -->
      @if (longestStreak > 0) {
        <div class="ml-auto flex items-center gap-1.5 bg-dark-700/60 border border-primary-700/30 rounded-lg px-3 py-1.5">
          <span class="text-sm">🏆</span>
          <span class="font-pixel text-xs text-primary-400">Best: {{ longestStreak }}</span>
        </div>
      }
    </div>
  `,
})
export class StreakDisplayComponent {
  @Input() streak = 0;
  @Input() longestStreak = 0;

  get streakBonus(): number {
    return Math.min(this.streak * 5, 50);
  }
}

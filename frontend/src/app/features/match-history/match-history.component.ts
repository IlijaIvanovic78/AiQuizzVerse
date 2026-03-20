import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { loadMatchHistory } from '../../store/match-history/match-history.actions';
import {
  selectMatchHistoryEntries,
  selectMatchHistoryLoading,
  selectMatchHistoryError,
} from '../../store/match-history/match-history.selectors';
import { selectUserId } from '../../store/auth/auth.selectors';
import { AvatarDisplayComponent } from '../../shared/components/avatar-display/avatar-display.component';

@Component({
  selector: 'app-match-history',
  standalone: true,
  imports: [CommonModule, DatePipe, AvatarDisplayComponent],
  templateUrl: './match-history.component.html',
})
export class MatchHistoryComponent implements OnInit {
  private store = inject(Store);

  matches$ = this.store.select(selectMatchHistoryEntries);
  loading$ = this.store.select(selectMatchHistoryLoading);
  error$ = this.store.select(selectMatchHistoryError);
  userId$ = this.store.select(selectUserId);

  ngOnInit(): void {
    this.store.dispatch(loadMatchHistory());
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'SOLO':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'PVP':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'COOP':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'RANKED':
        return 'text-accent-400 bg-accent-500/10 border-accent-500/30';
      default:
        return 'text-gray-400 bg-dark-700/50 border-dark-600';
    }
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      SOLO: '🎯',
      PVP: '⚔️',
      COOP: '🤝',
      RANKED: '🏆',
    };
    return icons[type] ?? '🎮';
  }

  getThemeIcon(theme: string): string {
    const icons: Record<string, string> = {
      SPACE: '🚀', HISTORY: '📜', PROGRAMMING: '💻', SCIENCE: '🔬',
      GEOGRAPHY: '🌍', LITERATURE: '📚', MATH: '🔢', GENERAL: '🎯', CUSTOM: '✨',
    };
    return icons[theme] ?? '🎯';
  }

  countCorrect(answers: { correct: boolean }[]): number {
    return answers.filter((a) => a.correct).length;
  }
}

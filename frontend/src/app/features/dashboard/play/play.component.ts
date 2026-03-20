import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { QuizActions } from '../../../store/quiz/quiz.actions';
import { GameActions } from '../../../store/game/game.actions';
import { selectQuizzes, selectQuizLoading } from '../../../store/quiz/quiz.selectors';
import { selectGameLoading, selectGameError } from '../../../store/game/game.selectors';
import { RankedActions, selectJourneys, selectRankedLoading } from '../../../store/ranked';
import { MatchType } from '../../../models';

type GameMode = 'SOLO' | 'PVP' | 'COOP' | 'RANKED';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './play.component.html',
})
export class PlayComponent implements OnInit {
  private store = inject(Store);

  @Output() journeySelect = new EventEmitter<string>();

  quizzes$ = this.store.select(selectQuizzes);
  quizLoading$ = this.store.select(selectQuizLoading);
  gameLoading$ = this.store.select(selectGameLoading);
  gameError$ = this.store.select(selectGameError);
  journeys$ = this.store.select(selectJourneys);
  rankedLoading$ = this.store.select(selectRankedLoading);

  selectedMode: GameMode | null = null;
  inviteCode = '';
  rankedTopic = '';

  gameModes: { type: GameMode; label: string; icon: string; desc: string; color: string }[] = [
    { type: 'SOLO', label: 'Solo', icon: '🎯', desc: 'Play alone at your own pace', color: 'border-green-500/40 hover:border-green-400' },
    { type: 'PVP', label: 'PvP', icon: '⚔️', desc: '1v1 real-time battle', color: 'border-red-500/40 hover:border-red-400' },
    { type: 'COOP', label: 'Co-op', icon: '🤝', desc: 'Team up with a friend', color: 'border-blue-500/40 hover:border-blue-400' },
    { type: 'RANKED', label: 'Ranked', icon: '🏆', desc: 'AI journey with increasing difficulty', color: 'border-accent-500/40 hover:border-accent-400' },
  ];

  ngOnInit(): void {
    this.store.dispatch(QuizActions.loadMyQuizzes());
    this.store.dispatch(RankedActions.loadJourneys());
  }

  selectMode(mode: GameMode): void {
    this.selectedMode = this.selectedMode === mode ? null : mode;
  }

  startGame(quizId: string, type: MatchType): void {
    this.store.dispatch(GameActions.createMatch({ quizId, matchType: type }));
  }

  joinMatch(): void {
    const code = this.inviteCode.trim();
    if (code.length === 6) {
      this.store.dispatch(GameActions.joinMatch({ inviteCode: code }));
    }
  }

  createRankedJourney(): void {
    if (this.rankedTopic.trim()) {
      this.store.dispatch(RankedActions.createJourney({ topic: this.rankedTopic.trim() }));
      this.rankedTopic = '';
    }
  }

  onJourneyClick(id: string): void {
    this.journeySelect.emit(id);
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'EASY': return 'text-green-400 bg-green-500/10';
      case 'MEDIUM': return 'text-accent-400 bg-accent-500/10';
      case 'HARD': return 'text-orange-400 bg-orange-500/10';
      case 'EXPERT': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-dark-700/50';
    }
  }

  getThemeIcon(theme: string): string {
    const icons: Record<string, string> = {
      SPACE: '🚀', HISTORY: '📜', PROGRAMMING: '💻', SCIENCE: '🔬',
      GEOGRAPHY: '🌍', LITERATURE: '📚', MATH: '🔢', GENERAL: '🎯', CUSTOM: '✨',
    };
    return icons[theme] ?? '🎯';
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { QuizActions } from '../../../store/quiz/quiz.actions';
import { GameActions } from '../../../store/game/game.actions';
import {
  selectQuizzes,
  selectQuizLoading,
} from '../../../store/quiz/quiz.selectors';
import { MatchType } from '../../../models';

@Component({
  selector: 'app-my-quizzes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-quizzes.component.html',
})
export class MyQuizzesComponent implements OnInit {
  private store = inject(Store);

  quizzes$ = this.store.select(selectQuizzes);
  loading$ = this.store.select(selectQuizLoading);

  ngOnInit(): void {
    this.store.dispatch(QuizActions.loadMyQuizzes());
  }

  deleteQuiz(quizId: string): void {
    this.store.dispatch(QuizActions.deleteQuiz({ quizId }));
  }

  playSolo(quizId: string): void {
    this.store.dispatch(GameActions.createMatch({ quizId, matchType: 'SOLO' }));
  }

  createPvP(quizId: string): void {
    this.store.dispatch(GameActions.createMatch({ quizId, matchType: 'PVP' }));
  }

  createCoop(quizId: string): void {
    this.store.dispatch(GameActions.createMatch({ quizId, matchType: 'COOP' }));
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'EASY': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'MEDIUM': return 'text-accent-400 bg-accent-500/10 border-accent-500/30';
      case 'HARD': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'EXPERT': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-dark-400 bg-dark-700/50 border-dark-600/30';
    }
  }

  getThemeIcon(theme: string): string {
    const icons: Record<string, string> = {
      SPACE: '🚀',
      HISTORY: '📜',
      PROGRAMMING: '💻',
      SCIENCE: '🔬',
      GEOGRAPHY: '🌍',
      LITERATURE: '📚',
      MATH: '🔢',
      GENERAL: '🎯',
      CUSTOM: '✨',
    };
    return icons[theme] ?? '🎯';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

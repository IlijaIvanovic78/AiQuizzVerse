import { Component, inject, OnInit, OnDestroy, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, take, filter } from 'rxjs/operators';
import { GameActions } from '../../../store/game/game.actions';
import {
  selectCurrentMatch,
  selectCurrentQuestion,
  selectQuestionIndex,
  selectTotalQuestions,
  selectTimePerQuestion,
  selectPlayerScore,
  selectOpponentScore,
  selectGameMode,
  selectLastResult,
  selectCurrentTurn,
  selectAllResults,
  selectWaitingForOpponent,
} from '../../../store/game/game.selectors';
import { selectUserId } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-play.component.html',
})
export class GamePlayComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  match$ = this.store.select(selectCurrentMatch);
  question$ = this.store.select(selectCurrentQuestion);
  questionIndex$ = this.store.select(selectQuestionIndex);
  totalQuestions$ = this.store.select(selectTotalQuestions);
  timePerQuestion$ = this.store.select(selectTimePerQuestion);
  playerScore$ = this.store.select(selectPlayerScore);
  opponentScore$ = this.store.select(selectOpponentScore);
  mode$ = this.store.select(selectGameMode);
  lastResult$ = this.store.select(selectLastResult);
  currentTurn$ = this.store.select(selectCurrentTurn);
  userId$ = this.store.select(selectUserId);
  allResults$ = this.store.select(selectAllResults);
  waitingForOpponent$ = this.store.select(selectWaitingForOpponent);

  timeRemaining = signal(0);
  selectedAnswer = signal<number | null>(null);
  answerStartTime = 0;
  answered = signal(false);
  showResult = signal(false);

  timerColor = computed(() => {
    const t = this.timeRemaining();
    if (t <= 5) return 'text-red-400';
    if (t <= 10) return 'text-yellow-400';
    return 'text-primary-400';
  });

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Reset on each new question
    this.question$.pipe(
      takeUntil(this.destroy$),
      filter((q) => !!q),
    ).subscribe(() => {
      this.selectedAnswer.set(null);
      this.answered.set(false);
      this.showResult.set(false);
      this.answerStartTime = Date.now();
      this.startTimer();
    });

    // Show result when answer comes back
    this.lastResult$.pipe(
      takeUntil(this.destroy$),
      filter((r) => !!r),
    ).subscribe(() => {
      this.showResult.set(true);
      this.stopTimer();
    });
  }

  private startTimer(): void {
    this.stopTimer();
    this.timePerQuestion$.pipe(take(1)).subscribe((t) => {
      this.timeRemaining.set(t);
    });

    this.timerId = setInterval(() => {
      const next = this.timeRemaining() - 1;
      this.timeRemaining.set(Math.max(next, 0));
      if (next <= 0) {
        this.stopTimer();
        this.autoSubmit();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  selectOption(index: number): void {
    if (this.answered()) return;
    this.selectedAnswer.set(index);
    this.answered.set(true);
    this.stopTimer();

    const timeMs = Date.now() - this.answerStartTime;

    combineLatest([this.match$, this.question$]).pipe(
      take(1),
    ).subscribe(([match, question]) => {
      if (match && question) {
        this.store.dispatch(GameActions.submitAnswer({
          matchId: match.id,
          questionId: question.id,
          answer: index,
          timeMs,
        }));
      }
    });
  }

  private autoSubmit(): void {
    if (this.answered()) return;
    this.answered.set(true);

    const timeMs = Date.now() - this.answerStartTime;

    combineLatest([this.match$, this.question$]).pipe(
      take(1),
    ).subscribe(([match, question]) => {
      if (match && question) {
        this.store.dispatch(GameActions.submitAnswer({
          matchId: match.id,
          questionId: question.id,
          answer: -1,
          timeMs,
        }));
      }
    });
  }

  getOptionClass(index: number): string {
    if (!this.showResult()) {
      return this.selectedAnswer() === index
        ? 'border-primary-500 bg-primary-500/10'
        : 'border-dark-600/30 hover:border-primary-500/50';
    }
    return '';
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

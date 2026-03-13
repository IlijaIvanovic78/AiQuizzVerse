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
import { selectShopBoosts } from '../../../store/shop/shop.selectors';
import { ShopActions } from '../../../store/shop/shop.actions';
import { SocketService } from '../../../services/socket.service';
import { BoostType, UserBoost } from '../../../models';

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-play.component.html',
})
export class GamePlayComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  private socketService = inject(SocketService);
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
  boosts$ = this.store.select(selectShopBoosts);

  timeRemaining = signal(0);
  selectedAnswer = signal<number | null>(null);
  answerStartTime = 0;
  answered = signal(false);
  showResult = signal(false);

  // Boost state
  eliminatedIndices = signal<number[]>([]);
  hintText = signal<string | null>(null);
  doublePointsActive = signal(false);
  boostUsedThisQuestion = signal<Set<BoostType>>(new Set());

  readonly BOOST_INFO: { type: BoostType; label: string; icon: string }[] = [
    { type: 'HINT', label: 'Hint', icon: '💡' },
    { type: 'EXTRA_TIME', label: '+10s', icon: '⏱️' },
    { type: 'FIFTY_FIFTY', label: '50/50', icon: '✂️' },
    { type: 'DOUBLE_POINTS', label: '2x', icon: '⚡' },
    { type: 'SHIELD', label: 'Shield', icon: '🛡️' },
    { type: 'STREAK_FREEZE', label: 'Freeze', icon: '❄️' },
  ];

  timerColor = computed(() => {
    const t = this.timeRemaining();
    if (t <= 5) return 'text-red-400';
    if (t <= 10) return 'text-yellow-400';
    return 'text-primary-400';
  });

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Load user boosts
    this.store.dispatch(ShopActions.loadBoosts());

    // Reset on each new question
    this.question$.pipe(
      takeUntil(this.destroy$),
      filter((q) => !!q),
    ).subscribe(() => {
      this.selectedAnswer.set(null);
      this.answered.set(false);
      this.showResult.set(false);
      this.eliminatedIndices.set([]);
      this.hintText.set(null);
      this.doublePointsActive.set(false);
      this.boostUsedThisQuestion.set(new Set());
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

    // Handle boost applied
    this.socketService.boostApplied$.pipe(
      takeUntil(this.destroy$),
    ).subscribe((result) => {
      if (result.type === 'FIFTY_FIFTY' && result.effect?.eliminatedIndices) {
        this.eliminatedIndices.set(result.effect.eliminatedIndices);
      } else if (result.type === 'HINT' && result.effect?.hint) {
        this.hintText.set(result.effect.hint);
      } else if (result.type === 'EXTRA_TIME') {
        this.timeRemaining.set(this.timeRemaining() + 10);
      } else if (result.type === 'DOUBLE_POINTS') {
        this.doublePointsActive.set(true);
      }
      // Reload boosts to sync quantities
      this.store.dispatch(ShopActions.loadBoosts());
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
    if (this.answered() || this.isOptionEliminated(index)) return;
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
      if (this.eliminatedIndices().includes(index)) {
        return 'border-dark-700/20 bg-dark-800/30 opacity-40 cursor-not-allowed';
      }
      return this.selectedAnswer() === index
        ? 'border-primary-500 bg-primary-500/10'
        : 'border-dark-600/30 hover:border-primary-500/50';
    }
    return '';
  }

  isOptionEliminated(index: number): boolean {
    return this.eliminatedIndices().includes(index);
  }

  useBoost(boostType: BoostType): void {
    if (this.answered() || this.boostUsedThisQuestion().has(boostType)) return;

    this.boostUsedThisQuestion.update((s) => {
      const next = new Set(s);
      next.add(boostType);
      return next;
    });

    combineLatest([this.match$, this.question$]).pipe(
      take(1),
    ).subscribe(([match, question]) => {
      if (match) {
        this.socketService.emitUseBoost(match.id, boostType, question?.id);
      }
    });
  }

  getBoostQuantity(boosts: UserBoost[], boostType: BoostType): number {
    return boosts.find((b) => b.type === boostType)?.quantity ?? 0;
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

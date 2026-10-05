import { Injectable, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  Observable,
  filter,
  from,
  map,
  merge,
  of,
  switchMap,
  take,
  takeUntil,
  timer,
  zip,
} from 'rxjs';
import { MatchSocketActions } from '../../store/match/match-socket.actions';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import {
  COUNTDOWN_LABELS,
  COUNTDOWN_STEP_MS,
  MS_PER_SECOND,
  TIMER_TICK_MS,
} from './play.constants';

// Everything on the match page that changes with time: the 3-2-1 countdown and the question timer.
// Provided by the match page, so the streams stop when the page closes.
@Injectable()
export class MatchClockService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  private readonly phase = this.store.selectSignal(matchFeature.selectPhase);
  private readonly mode = this.store.selectSignal(matchFeature.selectMode);
  private readonly deadlineAt = this.store.selectSignal(matchFeature.selectDeadlineAt);

  // In a party the others keep racing after a wrong answer, so the clock keeps running there.
  private readonly answered$ = this.actions$.pipe(
    ofType(MatchActions.answer),
    filter(() => this.mode() !== 'PARTY'),
  );
  private readonly roundEnded$ = this.actions$.pipe(
    ofType(MatchSocketActions.roundFinished, MatchSocketActions.finished),
  );

  readonly countdownLabel = toSignal(
    toObservable(this.phase).pipe(
      switchMap((phase) => (phase === 'countdown' ? this.countdownLabels() : of(null))),
    ),
    { initialValue: null },
  );

  // The timer stopped at the wrong first answer, so a second chance starts it again.
  private readonly secondChance$ = this.actions$.pipe(
    ofType(MatchSocketActions.secondChanceOffered),
    map(() => this.deadlineAt()),
  );

  // A new deadline (next question or extra time) restarts the timer through switchMap.
  readonly remainingMs = toSignal(
    merge(toObservable(this.deadlineAt), this.secondChance$).pipe(
      switchMap((deadlineAt) => (deadlineAt === null ? of(null) : this.timeLeftUntil(deadlineAt))),
    ),
    { initialValue: null },
  );

  readonly secondsLeft = computed(() => {
    const remainingMs = this.remainingMs();
    return remainingMs === null ? null : Math.ceil(remainingMs / MS_PER_SECOND);
  });

  private countdownLabels(): Observable<string> {
    return zip(from(COUNTDOWN_LABELS), timer(0, COUNTDOWN_STEP_MS)).pipe(map(([label]) => label));
  }

  // The bar freezes when the player answers, which shows how fast they were.
  private timeLeftUntil(deadlineAt: number): Observable<number> {
    const ticks = Math.ceil(msUntil(deadlineAt) / TIMER_TICK_MS);
    return timer(0, TIMER_TICK_MS).pipe(
      take(ticks + 1),
      map(() => msUntil(deadlineAt)),
      takeUntil(merge(this.answered$, this.roundEnded$)),
    );
  }
}

function msUntil(deadlineAt: number): number {
  return Math.max(0, deadlineAt - Date.now());
}

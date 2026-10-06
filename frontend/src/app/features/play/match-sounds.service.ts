import { DestroyRef, Injectable, computed, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { timer } from 'rxjs';
import { MatchResult } from '../../core/models/match.model';
import { RoundResultEvent } from '../../core/models/realtime-events.model';
import { SoundService } from '../../core/sound/sound.service';
import { authFeature } from '../../store/auth/auth.reducer';
import { MatchSocketActions } from '../../store/match/match-socket.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { MatchClockService } from './match-clock.service';
import { findPlayer, hasTreasureChest } from './match-result.rules';
import { COINS_LAND_MS, LEVEL_UP_DELAY_MS, TIMER_WARNING_SECONDS } from './play.constants';

// The sounds of a match: right and wrong answers, coins landing in the chest, the ticking of
// the last seconds, the level-up jingle and the Sound on/off button. Provided by the match page,
// like MatchClockService.
@Injectable()
export class MatchSoundsService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly sound = inject(SoundService);
  private readonly clock = inject(MatchClockService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mode = this.store.selectSignal(matchFeature.selectMode);
  private readonly round = this.store.selectSignal(matchFeature.selectRound);
  private readonly wrongTry = this.store.selectSignal(matchFeature.selectSecondChanceOption);
  private readonly user = this.store.selectSignal(authFeature.selectUser);
  private readonly meId = computed(() => this.user()?.id ?? '');

  readonly muted = this.sound.muted;

  constructor() {
    effect(() => {
      const round = this.round();
      untracked(() => this.playRoundSound(round));
    });
    effect(() => {
      const seconds = this.clock.secondsLeft();
      untracked(() => this.playTimerTick(seconds));
    });
    // Only a match that ends while the player watches is celebrated, not an old one opened
    // again from the match history.
    this.actions$
      .pipe(ofType(MatchSocketActions.finished), takeUntilDestroyed())
      .subscribe(({ result }) => this.celebrate(result));
    // A second chance means the first pick was wrong, even though the round goes on.
    effect(() => {
      if (this.wrongTry() !== null) {
        untracked(() => this.sound.playWrong());
      }
    });
  }

  toggleMuted(): void {
    this.sound.toggleMuted();
  }

  private playRoundSound(round: RoundResultEvent | null): void {
    const mine = round?.players.find((player) => player.userId === this.meId());
    if (!mine) {
      return;
    }
    if (!mine.correct) {
      this.sound.playWrong();
      return;
    }
    this.sound.playCorrect();
    const mode = this.mode();
    if (mode !== null && hasTreasureChest(mode)) {
      this.after(COINS_LAND_MS, () => this.sound.playCoin());
    }
  }

  private playTimerTick(seconds: number | null): void {
    if (seconds !== null && seconds > 0 && seconds <= TIMER_WARNING_SECONDS) {
      this.sound.playTick();
    }
  }

  private celebrate(result: MatchResult): void {
    const me = findPlayer(result, this.meId());
    if (!me) {
      return;
    }
    if (me.coinsEarned > 0) {
      this.sound.playCoin();
    }
    if (result.leveledUp) {
      this.after(LEVEL_UP_DELAY_MS, () => this.sound.playLevelUp());
    }
  }

  private after(ms: number, action: () => void): void {
    timer(ms).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(action);
  }
}

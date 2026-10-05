import { DestroyRef, Injectable, computed, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { timer } from 'rxjs';
import { MatchResult } from '../../core/models/match.model';
import { RoundResultEvent } from '../../core/models/realtime-events.model';
import { SoundService } from '../../core/sound/sound.service';
import { authFeature } from '../../store/auth/auth.reducer';
import { matchFeature } from '../../store/match/match.reducer';
import { MatchClockService } from './match-clock.service';
import { findPlayer, hasTreasureChest } from './match-result';
import { COINS_LAND_MS, LEVEL_UP_DELAY_MS, TIMER_WARNING_SECONDS } from './play.constants';

// The sounds of a match: right and wrong answers, coins landing in the chest, the ticking of
// the last seconds, the level-up jingle and the Sound on/off button. Provided by the match page,
// like MatchClockService.
@Injectable()
export class MatchSoundsService {
  private readonly store = inject(Store);
  private readonly sound = inject(SoundService);
  private readonly clock = inject(MatchClockService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mode = this.store.selectSignal(matchFeature.selectMode);
  private readonly round = this.store.selectSignal(matchFeature.selectRound);
  private readonly result = this.store.selectSignal(matchFeature.selectResult);
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
    effect(() => {
      const result = this.result();
      untracked(() => this.celebrate(result));
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

  private celebrate(result: MatchResult | null): void {
    const me = result ? findPlayer(result, this.meId()) : null;
    if (!result || !me) {
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

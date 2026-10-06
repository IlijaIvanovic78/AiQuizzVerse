import { DestroyRef, Injectable, computed, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, map, timer } from 'rxjs';
import { AttackType, MatchResult } from '../../core/models/match.model';
import {
  RoundResultEvent,
  SabotageBlockedEvent,
  SabotagedEvent,
} from '../../core/models/realtime-events.model';
import { SoundService } from '../../core/sound/sound.service';
import { starsForAccuracy } from '../../shared/stars';
import { authFeature } from '../../store/auth/auth.reducer';
import { MatchSocketActions } from '../../store/match/match-socket.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { MatchClockService } from './match-clock.service';
import { accuracyPercent, findPlayer, hasTreasureChest } from './match-result.rules';
import {
  RoundSound,
  countdownSound,
  endingSound,
  isSameRound,
  roundSound,
  starPlinkDelays,
  timerTick,
} from './match-sounds.rules';
import { COINS_LAND_MS, LEVEL_UP_DELAY_MS } from './play.constants';

// The sounds of a match: the countdown, the ticking clock, answers, power-ups, sabotages,
// round results, the end of the match and the Sound on/off button. Provided by the match page,
// like MatchClockService.
@Injectable()
export class MatchSoundsService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly sound = inject(SoundService);
  private readonly clock = inject(MatchClockService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mode = this.store.selectSignal(matchFeature.selectMode);
  private readonly myAnswer = this.store.selectSignal(matchFeature.selectMyAnswer);
  private readonly wrongTry = this.store.selectSignal(matchFeature.selectSecondChanceOption);
  private readonly user = this.store.selectSignal(authFeature.selectUser);
  private readonly meId = computed(() => this.user()?.id ?? '');

  private readonly roundSounds: Record<RoundSound, () => void> = {
    correct: () => this.playCorrect(),
    wrong: () => this.sound.playWrong(),
    'round-lost': () => this.sound.playRoundLost(),
    'time-up': () => this.sound.playTimeUp(),
  };
  private readonly sabotageSounds: Record<AttackType, () => void> = {
    INK: () => this.sound.playInked(),
    FREEZE: () => this.sound.playFrozen(),
    SCRAMBLE: () => this.sound.playScrambled(),
    FOG: () => this.sound.playFogged(),
    QUAKE: () => this.sound.playShaken(),
    MIRROR: () => this.sound.playMirrored(),
  };

  readonly muted = this.sound.muted;

  constructor() {
    effect(() => {
      const label = this.clock.countdownLabel();
      untracked(() => this.playCountdown(label));
    });
    effect(() => {
      const seconds = this.clock.secondsLeft();
      untracked(() => this.playTimerTick(seconds));
    });
    effect(() => {
      if (this.myAnswer() !== null) {
        untracked(() => this.sound.playAnswerLocked());
      }
    });
    // A second chance means the first pick was wrong, even though the round goes on.
    effect(() => {
      if (this.wrongTry() !== null) {
        untracked(() => this.sound.playWrong());
      }
    });
    this.listenToMatchEvents();
  }

  toggleMuted(): void {
    this.sound.toggleMuted();
  }

  private listenToMatchEvents(): void {
    this.actions$
      .pipe(
        ofType(MatchSocketActions.playerAnswered),
        filter(({ userId }) => userId !== this.meId()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.sound.playOtherAnswered());
    // In a party a wrong answer locks me out right away, while the others keep racing.
    this.actions$
      .pipe(
        ofType(MatchSocketActions.playerLockedOut),
        filter(({ userId }) => userId === this.meId()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.sound.playWrong());
    // A round result sent again after a reconnect is the same round, so it plays no second sound.
    this.actions$
      .pipe(
        ofType(MatchSocketActions.roundFinished),
        map(({ round }) => round),
        distinctUntilChanged(isSameRound),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((round) => this.playRoundSound(round));
    this.actions$
      .pipe(ofType(MatchSocketActions.boostUsed), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sound.playPowerUp());
    this.actions$
      .pipe(ofType(MatchSocketActions.playerSabotaged), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ sabotage }) => this.playSabotageOnMe(sabotage));
    this.actions$
      .pipe(ofType(MatchSocketActions.sabotageBlocked), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ block }) => this.playBlockedSabotage(block));
    // Only a match that ends while the player watches is celebrated, not an old one opened
    // again from the match history.
    this.actions$
      .pipe(ofType(MatchSocketActions.finished), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ result }) => this.celebrate(result));
  }

  private playCountdown(label: string | null): void {
    const sound = countdownSound(label);
    if (sound === 'beep') {
      this.sound.playCountdownBeep();
    } else if (sound === 'go') {
      this.sound.playGo();
    }
  }

  private playTimerTick(seconds: number | null): void {
    const tick = timerTick(seconds, this.myAnswer() !== null);
    if (tick !== null) {
      this.sound.playTick(tick === 'urgent');
    }
  }

  private playRoundSound(round: RoundResultEvent): void {
    const mode = this.mode();
    if (mode === null) {
      return;
    }
    const sound = roundSound(round, this.meId(), mode);
    if (sound !== null) {
      this.roundSounds[sound]();
    }
  }

  // In solo and team games the coins of a right answer land in the chest a moment later.
  private playCorrect(): void {
    this.sound.playCorrect();
    const mode = this.mode();
    if (mode !== null && hasTreasureChest(mode)) {
      this.after(COINS_LAND_MS, () => this.sound.playCoin());
    }
  }

  // Shields make no sound when raised; only the attacks that land on me do.
  private playSabotageOnMe(sabotage: SabotagedEvent): void {
    if (sabotage.targetUserId === this.meId() && sabotage.type !== 'SHIELD') {
      this.sabotageSounds[sabotage.type]();
    }
  }

  // My shield stopped an attack, or my attack hit someone's shield.
  private playBlockedSabotage(block: SabotageBlockedEvent): void {
    if (block.targetUserId === this.meId() || block.fromUserId === this.meId()) {
      this.sound.playShieldBlocked();
    }
  }

  private celebrate(result: MatchResult): void {
    const me = findPlayer(result, this.meId());
    if (!me) {
      return;
    }
    switch (endingSound(result, this.meId())) {
      case 'victory':
        this.sound.playVictory();
        break;
      case 'almost':
        this.sound.playAlmost();
        break;
      case 'draw':
        // A draw still pays the draw bonus.
        this.sound.playCoin();
        break;
      case 'stars':
        this.plinkStars(starsForAccuracy(accuracyPercent(me.correctCount, result.questionCount)));
        break;
    }
    if (result.leveledUp) {
      this.after(LEVEL_UP_DELAY_MS, () => this.sound.playLevelUp());
    }
  }

  private plinkStars(stars: number): void {
    starPlinkDelays(stars).forEach((delay, starIndex) =>
      this.after(delay, () => this.sound.playStar(starIndex)),
    );
  }

  private after(ms: number, action: () => void): void {
    timer(ms).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(action);
  }
}

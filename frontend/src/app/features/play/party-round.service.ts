import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map, of, switchMap, timer } from 'rxjs';
import { SabotageType } from '../../core/models/match.model';
import { authFeature } from '../../store/auth/auth.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { effectEndsAt, sabotageNotice, sabotageTargets, secondsLeft } from './party-round';
import { SABOTAGE_NOTICE_MS, SCRAMBLE_SHAKE_MS, TIMER_TICK_MS } from './play.constants';

// The party part of the match page: sabotage charges, picking a target, and the sabotage
// effects that wear off after a few seconds. Provided by the match page, like MatchClockService.
@Injectable()
export class PartyRoundService {
  private readonly store = inject(Store);

  private readonly phase = this.store.selectSignal(matchFeature.selectPhase);
  private readonly mode = this.store.selectSignal(matchFeature.selectMode);
  private readonly match = this.store.selectSignal(matchFeature.selectMatch);
  private readonly question = this.store.selectSignal(matchFeature.selectQuestion);
  private readonly charges = this.store.selectSignal(matchFeature.selectCharges);
  private readonly sabotages = this.store.selectSignal(matchFeature.selectSabotages);
  private readonly answeredUserIds = this.store.selectSignal(matchFeature.selectAnsweredUserIds);
  private readonly leftUserIds = this.store.selectSignal(matchFeature.selectLeftUserIds);
  private readonly lockedOutUserIds = this.store.selectSignal(matchFeature.selectLockedOutUserIds);
  private readonly user = this.store.selectSignal(authFeature.selectUser);
  private readonly meId = computed(() => this.user()?.id ?? '');
  private readonly questionIndex = computed(() => this.question()?.index ?? null);

  private readonly questionOpen = computed(
    () => this.mode() === 'PARTY' && this.phase() === 'question',
  );

  // Ticks while a party question is open, so every effect wears off on time.
  private readonly now = toSignal(
    toObservable(this.questionOpen).pipe(
      switchMap((open) =>
        open ? timer(0, TIMER_TICK_MS).pipe(map(() => Date.now())) : of(Date.now()),
      ),
    ),
    { initialValue: Date.now() },
  );

  private readonly chosen = signal<SabotageType | null>(null);
  readonly chosenType = this.chosen.asReadonly();

  readonly myCharges = computed(() => this.charges()[this.meId()] ?? 0);
  readonly lockedOut = computed(() => this.lockedOutUserIds().includes(this.meId()));
  readonly usedThisRound = computed(() =>
    this.sabotages().some((hit) => hit.fromUserId === this.meId()),
  );
  readonly targetIds = computed(() => {
    const players = this.match()?.players ?? [];
    return sabotageTargets(players, this.meId(), this.answeredUserIds(), this.leftUserIds());
  });
  readonly canSabotage = computed(
    () =>
      this.questionOpen() &&
      this.myCharges() > 0 &&
      !this.usedThisRound() &&
      this.targetIds().length > 0,
  );

  readonly frozenSecondsLeft = computed(() => {
    const frozenUntil = effectEndsAt(this.sabotages(), this.meId(), 'FREEZE');
    return this.questionOpen() ? secondsLeft(frozenUntil, this.now()) : 0;
  });
  readonly inked = computed(() => this.isUnder(this.meId(), 'INK'));
  // A scramble lasts until the question ends, but the answers shake only right after it lands.
  readonly scrambling = computed(() =>
    this.sabotages().some(
      (hit) =>
        hit.type === 'SCRAMBLE' &&
        hit.targetUserId === this.meId() &&
        hit.landedAt + SCRAMBLE_SHAKE_MS > this.now(),
    ),
  );
  readonly frozenUserIds = computed(() => this.playersUnder('FREEZE'));
  readonly inkedUserIds = computed(() => this.playersUnder('INK'));

  readonly notice = computed(() => {
    const latest = this.sabotages().at(-1);
    if (!this.questionOpen() || !latest || latest.landedAt + SABOTAGE_NOTICE_MS < this.now()) {
      return null;
    }
    return sabotageNotice(latest, this.meId(), this.playerNames());
  });

  private readonly playerNames = computed(() => {
    const names: Record<string, string> = {};
    this.match()?.players.forEach((player) => (names[player.user.id] = player.user.username));
    return names;
  });

  constructor() {
    // A half-made choice never carries over to the next question.
    effect(() => {
      this.questionIndex();
      this.phase();
      untracked(() => this.chosen.set(null));
    });
  }

  choose(type: SabotageType): void {
    this.chosen.set(type);
  }

  cancel(): void {
    this.chosen.set(null);
  }

  hit(targetUserId: string): void {
    const sabotageType = this.chosen();
    if (sabotageType && this.canSabotage() && this.targetIds().includes(targetUserId)) {
      this.store.dispatch(MatchActions.sabotage({ targetUserId, sabotageType }));
    }
    this.chosen.set(null);
  }

  private isUnder(userId: string, type: SabotageType): boolean {
    return this.questionOpen() && effectEndsAt(this.sabotages(), userId, type) > this.now();
  }

  private playersUnder(type: SabotageType): string[] {
    const players = this.match()?.players ?? [];
    return players.map((player) => player.user.id).filter((id) => this.isUnder(id, type));
  }
}

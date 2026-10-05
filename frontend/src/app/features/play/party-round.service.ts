import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { map, of, switchMap, timer } from 'rxjs';
import { AttackType } from '../../core/models/match.model';
import { authFeature } from '../../store/auth/auth.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { BannerTone } from './components/arena-banner.component';
import {
  blockNotice,
  effectEndsAt,
  lastingHits,
  sabotageNotice,
  sabotageTargets,
  secondsLeft,
} from './party-round';
import {
  BLOCKED_SHOW_MS,
  SABOTAGE_NOTICE_MS,
  SCRAMBLE_SHAKE_MS,
  TIMER_TICK_MS,
} from './play.constants';
import { namesById } from './round-view';

interface ArenaNews {
  text: string;
  tone: BannerTone;
}

// The party part of the match page: who won the round, sabotage charges, picking a target,
// shields, and the sabotage effects that wear off after a few seconds. Provided by the match
// page, like MatchClockService.
@Injectable()
export class PartyRoundService {
  private readonly store = inject(Store);

  private readonly phase = this.store.selectSignal(matchFeature.selectPhase);
  private readonly mode = this.store.selectSignal(matchFeature.selectMode);
  private readonly match = this.store.selectSignal(matchFeature.selectMatch);
  private readonly question = this.store.selectSignal(matchFeature.selectQuestion);
  private readonly myAnswer = this.store.selectSignal(matchFeature.selectMyAnswer);
  private readonly charges = this.store.selectSignal(matchFeature.selectCharges);
  private readonly sabotages = this.store.selectSignal(matchFeature.selectSabotages);
  private readonly blocks = this.store.selectSignal(matchFeature.selectBlocks);
  readonly shieldedUserIds = this.store.selectSignal(matchFeature.selectShieldedUserIds);
  private readonly answeredUserIds = this.store.selectSignal(matchFeature.selectAnsweredUserIds);
  private readonly leftUserIds = this.store.selectSignal(matchFeature.selectLeftUserIds);
  private readonly lockedOutUserIds = this.store.selectSignal(matchFeature.selectLockedOutUserIds);
  private readonly winnerId = this.store.selectSignal(matchFeature.selectRoundWinnerId);
  private readonly user = this.store.selectSignal(authFeature.selectUser);
  private readonly meId = computed(() => this.user()?.id ?? '');
  private readonly playerNames = computed(() => namesById(this.match()?.players ?? []));
  private readonly questionIndex = computed(() => this.question()?.index ?? null);

  private readonly isParty = computed(() => this.mode() === 'PARTY');
  private readonly questionOpen = computed(() => this.isParty() && this.phase() === 'question');

  // Ticks while a party question is open, so every effect wears off on time.
  private readonly now = toSignal(
    toObservable(this.questionOpen).pipe(
      switchMap((open) =>
        open ? timer(0, TIMER_TICK_MS).pipe(map(() => Date.now())) : of(Date.now()),
      ),
    ),
    { initialValue: Date.now() },
  );

  private readonly chosen = signal<AttackType | null>(null);
  readonly chosenType = this.chosen.asReadonly();

  // Who answered the round first, shown while its answer is revealed.
  readonly roundWinnerId = computed(() => (this.phase() === 'reveal' ? this.winnerId() : null));

  readonly myCharges = computed(() => this.charges()[this.meId()] ?? 0);
  readonly lockedOut = computed(() => this.lockedOutUserIds().includes(this.meId()));
  // A shield counts as the one sabotage move of the round, and so does an attack that was blocked.
  readonly usedThisRound = computed(
    () =>
      this.sabotages().some((hit) => hit.fromUserId === this.meId()) ||
      this.blocks().some((block) => block.fromUserId === this.meId()),
  );
  readonly targetIds = computed(() => {
    const players = this.match()?.players ?? [];
    return sabotageTargets(players, this.meId(), this.answeredUserIds(), this.leftUserIds());
  });
  private readonly canAct = computed(
    () => this.questionOpen() && this.myCharges() > 0 && !this.usedThisRound(),
  );
  readonly canSabotage = computed(() => this.canAct() && this.targetIds().length > 0);
  // The server takes a shield only from a player who can still answer.
  readonly canShield = computed(
    () =>
      this.canAct() &&
      this.myAnswer() === null &&
      !this.lockedOut() &&
      !this.answeredUserIds().includes(this.meId()),
  );

  readonly shielded = computed(() => this.shieldedUserIds().includes(this.meId()));
  readonly blockedUserIds = computed(() =>
    this.blocks()
      .filter((block) => block.landedAt + BLOCKED_SHOW_MS > this.now())
      .map((block) => block.targetUserId),
  );

  readonly frozenSecondsLeft = computed(() => {
    const frozenUntil = effectEndsAt(this.sabotages(), this.meId(), 'FREEZE');
    return this.questionOpen() ? secondsLeft(frozenUntil, this.now()) : 0;
  });
  readonly inked = computed(() => this.isUnder(this.meId(), 'INK'));
  readonly fogged = computed(() => this.isUnder(this.meId(), 'FOG'));
  readonly quaking = computed(() => this.isUnder(this.meId(), 'QUAKE'));
  readonly mirrored = computed(() => this.isUnder(this.meId(), 'MIRROR'));
  // A scramble lasts until the question ends, but the answers shake only right after it lands.
  readonly scrambling = computed(() =>
    this.sabotages().some(
      (hit) =>
        hit.type === 'SCRAMBLE' &&
        hit.targetUserId === this.meId() &&
        hit.landedAt + SCRAMBLE_SHAKE_MS > this.now(),
    ),
  );
  // The effect each player is under right now, shown on their hero and their seat.
  readonly hitByUserId = computed(() =>
    this.questionOpen() ? lastingHits(this.sabotages(), this.now()) : {},
  );

  private readonly notice = computed(() => {
    if (!this.questionOpen()) {
      return null;
    }
    const hit = this.sabotages().at(-1);
    const block = this.blocks().at(-1);
    if (block && (!hit || block.landedAt >= hit.landedAt)) {
      return this.isFresh(block.landedAt)
        ? blockNotice(block, this.meId(), this.playerNames())
        : null;
    }
    return hit && this.isFresh(hit.landedAt)
      ? sabotageNotice(hit, this.meId(), this.playerNames())
      : null;
  });

  // The line over the arena: who answered first after a round, or the latest sabotage while
  // a question is open.
  readonly arenaNews = computed<ArenaNews | null>(() => {
    if (!this.isParty()) {
      return null;
    }
    if (this.phase() === 'reveal') {
      return { text: this.roundWinnerText(), tone: 'torch' };
    }
    const notice = this.notice();
    return notice ? { text: notice, tone: 'night' } : null;
  });

  constructor() {
    // A half-made choice never carries over to the next question.
    effect(() => {
      this.questionIndex();
      this.phase();
      untracked(() => this.chosen.set(null));
    });
  }

  choose(type: AttackType): void {
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

  raiseShield(): void {
    if (this.canShield()) {
      this.store.dispatch(MatchActions.raiseShield());
    }
    this.chosen.set(null);
  }

  private roundWinnerText(): string {
    const winnerId = this.winnerId();
    if (!winnerId) {
      return 'Nobody got it this time!';
    }
    if (winnerId === this.meId()) {
      return 'You got it first!';
    }
    return `${this.playerNames()[winnerId] ?? 'Someone'} got it first!`;
  }

  private isFresh(landedAt: number): boolean {
    return landedAt + SABOTAGE_NOTICE_MS > this.now();
  }

  private isUnder(userId: string, type: AttackType): boolean {
    return this.questionOpen() && effectEndsAt(this.sabotages(), userId, type) > this.now();
  }
}

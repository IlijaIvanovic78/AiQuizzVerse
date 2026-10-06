import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable, Subject, map, merge, take } from 'rxjs';
import { MatchMode, MatchResult } from '../../core/models/match.model';
import { MatchBoostType } from '../../core/models/shop.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { TreasureChestComponent } from '../../shared/components/treasure-chest.component';
import { authFeature } from '../../store/auth/auth.reducer';
import { FriendsActions } from '../../store/friends/friends.actions';
import { friendsFeature } from '../../store/friends/friends.reducer';
import { MatchSocketActions } from '../../store/match/match-socket.actions';
import { MatchActions } from '../../store/match/match.actions';
import { MatchPhase, matchFeature } from '../../store/match/match.reducer';
import { ReviewActions } from '../../store/review/review.actions';
import { ArenaFighter, arenaSides, toFighter } from './arena-fighter.rules';
import { AnswerGridComponent } from './components/answer-grid.component';
import { ArenaBannerComponent } from './components/arena-banner.component';
import { BattleArenaComponent } from './components/battle-arena.component';
import { BoostsBarComponent } from './components/boosts-bar.component';
import { CountdownOverlayComponent } from './components/countdown-overlay.component';
import { FogCloudComponent } from './components/fog-cloud.component';
import { FrostFrameComponent } from './components/frost-frame.component';
import { GetReadyComponent } from './components/get-ready.component';
import { InkSplashComponent } from './components/ink-splash.component';
import { MatchHeaderComponent } from './components/match-header.component';
import { MatchLobbyComponent } from './components/match-lobby.component';
import { MatchResultsComponent } from './components/match-results.component';
import { PartyScoreboardComponent } from './components/party-scoreboard.component';
import { QuestionCardComponent } from './components/question-card.component';
import { RevealPanelComponent } from './components/reveal-panel.component';
import { SabotageBarComponent } from './components/sabotage-bar.component';
import { ScoreboardComponent } from './components/scoreboard.component';
import { TimerBarComponent } from './components/timer-bar.component';
import { LobbyInviteService } from './lobby-invite.service';
import { MatchClockService } from './match-clock.service';
import { hasModifier, isControl, isTypingOrInDialog } from './match-keys';
import { MatchReadAloudService } from './match-read-aloud.service';
import { chestLabelFor, chestSize, hasTreasureChest } from './match-result.rules';
import { MatchSoundsService } from './match-sounds.service';
import { PartyRoundService } from './party-round.service';
import { ANSWER_KEYS, NEXT_KEYS } from './play.constants';
import { namesById, toRoundView } from './round-view.rules';

type MatchStage = 'loading' | 'lobby' | 'battle' | 'finished' | 'interrupted';

const RUNNING_PHASES: MatchPhase[] = ['countdown', 'question', 'reveal'];

const LEAVE_WARNINGS: Record<MatchMode, string> = {
  SOLO: 'If you leave now, this quiz stops and you get no rewards for it.',
  TEAM: 'Leaving ends the team match for both of you.',
  PARTY: 'Leaving counts as giving up. The party goes on without you.',
};

// The whole match on one page, from the lobby to the results. Each side job lives in its own
// service provided here, so it starts and stops together with the page.
@Component({
  selector: 'app-match-page',
  imports: [
    RouterLink,
    AnswerGridComponent,
    ArenaBannerComponent,
    BattleArenaComponent,
    BoostsBarComponent,
    ConfirmDialogComponent,
    CountdownOverlayComponent,
    EmptyStateComponent,
    FogCloudComponent,
    FrostFrameComponent,
    GetReadyComponent,
    InkSplashComponent,
    MatchHeaderComponent,
    MatchLobbyComponent,
    MatchResultsComponent,
    PartyScoreboardComponent,
    PixelIconComponent,
    QuestionCardComponent,
    RevealPanelComponent,
    SabotageBarComponent,
    ScoreboardComponent,
    SpinnerComponent,
    TimerBarComponent,
    TreasureChestComponent,
  ],
  templateUrl: './match-page.component.html',
  providers: [
    MatchClockService,
    PartyRoundService,
    MatchSoundsService,
    MatchReadAloudService,
    LobbyInviteService,
  ],
  host: { '(document:keydown)': 'handleKey($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchPageComponent {
  readonly matchId = input.required<string>();

  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly router = inject(Router);
  protected readonly clock = inject(MatchClockService);
  protected readonly party = inject(PartyRoundService);
  protected readonly sounds = inject(MatchSoundsService);
  protected readonly reader = inject(MatchReadAloudService);
  protected readonly lobby = inject(LobbyInviteService);

  protected readonly phase = this.store.selectSignal(matchFeature.selectPhase);
  protected readonly match = this.store.selectSignal(matchFeature.selectMatch);
  protected readonly question = this.store.selectSignal(matchFeature.selectQuestion);
  protected readonly round = this.store.selectSignal(matchFeature.selectRound);
  protected readonly myAnswer = this.store.selectSignal(matchFeature.selectMyAnswer);
  protected readonly nextPressed = this.store.selectSignal(matchFeature.selectNextPressed);
  protected readonly teamCorrect = this.store.selectSignal(matchFeature.selectTeamCorrect);
  protected readonly freeHintsLeft = this.store.selectSignal(matchFeature.selectFreeHintsLeft);
  protected readonly boostUses = this.store.selectSignal(matchFeature.selectBoostUses);
  protected readonly boostsUsed = this.store.selectSignal(matchFeature.selectBoostsUsedThisRound);
  protected readonly removedOptions = this.store.selectSignal(matchFeature.selectEliminatedOptions);
  protected readonly hint = this.store.selectSignal(matchFeature.selectHint);
  protected readonly wrongTry = this.store.selectSignal(matchFeature.selectSecondChanceOption);
  protected readonly result = this.store.selectSignal(matchFeature.selectResult);
  protected readonly busy = this.store.selectSignal(matchFeature.selectBusy);
  private readonly error = this.store.selectSignal(matchFeature.selectError);
  private readonly scores = this.store.selectSignal(matchFeature.selectScores);
  private readonly answeredUserIds = this.store.selectSignal(matchFeature.selectAnsweredUserIds);
  private readonly waitingForUserIds = this.store.selectSignal(
    matchFeature.selectWaitingForUserIds,
  );
  private readonly leftUserIds = this.store.selectSignal(matchFeature.selectLeftUserIds);
  private readonly lockedOutUserIds = this.store.selectSignal(matchFeature.selectLockedOutUserIds);
  private readonly charges = this.store.selectSignal(matchFeature.selectCharges);
  private readonly shieldedUserIds = this.store.selectSignal(matchFeature.selectShieldedUserIds);
  private readonly user = this.store.selectSignal(authFeature.selectUser);
  private readonly signedIn = this.store.selectSignal(authFeature.selectIsAuthenticated);
  protected readonly onlineFriends = this.store.selectSignal(friendsFeature.selectOnlineFriends);

  protected readonly leaveDialogOpen = signal(false);
  private readonly leaveDecision$ = new Subject<boolean>();

  // True when the match ended while the player was watching. A finished match opened later from
  // the match history loads its result instead, and it is not celebrated a second time.
  protected readonly justFinished = toSignal(
    merge(
      this.actions$.pipe(
        ofType(MatchSocketActions.finished),
        map(() => true),
      ),
      this.actions$.pipe(
        ofType(MatchActions.resultLoaded),
        map(() => false),
      ),
    ),
    { initialValue: false },
  );

  protected readonly meId = computed(() => this.user()?.id ?? '');
  protected readonly level = computed(() => this.user()?.level ?? 1);
  protected readonly mode = computed<MatchMode>(() => this.match()?.mode ?? 'SOLO');
  protected readonly stage = computed(() => stageFor(this.phase(), this.mode()));
  // The results and the "match has ended" screen have their own titles.
  protected readonly showHeader = computed(
    () => this.stage() !== 'finished' && this.stage() !== 'interrupted',
  );
  protected readonly isParty = computed(() => this.mode() === 'PARTY');
  private readonly isRunning = computed(() => RUNNING_PHASES.includes(this.phase()));
  private readonly hostInLobby = computed(
    () => this.stage() === 'lobby' && this.match()?.hostId === this.meId(),
  );
  private readonly playerNames = computed(() => namesById(this.match()?.players ?? []));

  private readonly fighters = computed(() => this.buildFighters());
  private readonly me = computed(() => this.fighters().find((fighter) => fighter.isMe) ?? null);
  private readonly others = computed(() => this.fighters().filter((fighter) => !fighter.isMe));
  protected readonly meFirst = computed(() => {
    const me = this.me();
    return me ? [me, ...this.others()] : this.others();
  });
  protected readonly sides = computed(() => arenaSides(this.mode(), this.meFirst()));
  // Three or four party heroes stand two on each platform.
  protected readonly crowded = computed(() => this.isParty() && this.meFirst().length > 2);
  protected readonly emptySide = computed(() => {
    if (this.stage() !== 'lobby' || (this.match()?.players.length ?? 0) > 1) {
      return null;
    }
    return this.mode() === 'TEAM' ? 'left' : 'right';
  });

  protected readonly showChest = computed(
    () => this.match() !== null && hasTreasureChest(this.mode()),
  );
  protected readonly chestTotal = computed(() => {
    const match = this.match();
    return match ? chestSize(match.players.length, match.quiz.questionCount) : 0;
  });
  protected readonly chestLabel = computed(() => chestLabelFor(this.mode()));
  // Coins fly into the chest after every round where someone was right. The next question
  // turns this off again, so the following strike starts the animations anew.
  protected readonly coinsFlying = computed(() => {
    const someoneCorrect = this.round()?.players.some((player) => player.correct) ?? false;
    return this.phase() === 'reveal' && someoneCorrect;
  });

  protected readonly roundView = computed(() => {
    const round = this.round();
    return round ? toRoundView(round, this.question(), this.meId(), this.playerNames()) : null;
  });
  protected readonly showQuestion = computed(() => {
    const question = this.question();
    if (!question || this.phase() === 'countdown') {
      return false;
    }
    return this.phase() === 'question' || question.index === this.round()?.index;
  });
  // Leaving in the middle of a question gives it up, so after coming back the server counts
  // the player as answered and they wait for the next question.
  protected readonly sittingOut = computed(
    () =>
      this.phase() === 'question' &&
      this.myAnswer() === null &&
      this.answeredUserIds().includes(this.meId()),
  );
  protected readonly answersPaused = computed(
    () => this.sittingOut() || this.party.frozenSecondsLeft() > 0,
  );
  protected readonly secondChanceOpen = computed(
    () => this.phase() === 'question' && this.wrongTry() !== null && this.myAnswer() === null,
  );
  protected readonly myPick = computed(() => {
    const roundView = this.roundView();
    return roundView ? roundView.myPick : this.myAnswer();
  });
  protected readonly waitingForNames = computed(() =>
    this.waitingForUserIds()
      .filter((userId) => userId !== this.meId())
      .map((userId) => this.playerNames()[userId] ?? 'your friend'),
  );
  protected readonly isLastRound = computed(() => {
    const round = this.round();
    const match = this.match();
    return round !== null && match !== null && round.index + 1 >= match.quiz.questionCount;
  });

  protected readonly progressLabel = computed(() => {
    const total = this.match()?.quiz.questionCount ?? 0;
    const index = this.question()?.index ?? this.round()?.index;
    return index === undefined || this.phase() === 'countdown'
      ? ''
      : `Question ${index + 1} of ${total}`;
  });
  protected readonly quitLabel = computed(() => {
    if (this.stage() === 'lobby') {
      return 'Leave';
    }
    return this.isRunning() ? 'Quit' : null;
  });
  protected readonly loadingText = computed(() => {
    // Only a solo match waits in the lobby while loading: it starts by itself right after joining.
    if (this.phase() === 'lobby') {
      return 'Getting your quiz ready...';
    }
    return this.match()?.status === 'IN_PROGRESS'
      ? 'Rejoining your match...'
      : 'Entering the arena...';
  });
  protected readonly leaveWarning = computed(() => LEAVE_WARNINGS[this.mode()]);
  // A party that ended because everyone else left.
  protected readonly rivalLeft = computed(
    () =>
      this.isParty() && this.others().length > 0 && this.others().every((fighter) => fighter.away),
  );
  protected readonly interruptedText = computed(
    () => this.error() ?? 'This match stopped before it was finished.',
  );

  constructor() {
    // /play/A to /play/B reuses this page, so every new id enters its own match.
    effect(() => {
      const matchId = this.matchId();
      untracked(() => this.store.dispatch(MatchActions.entered({ matchId })));
    });
    effect(() => {
      if (this.hostInLobby()) {
        untracked(() => this.store.dispatch(FriendsActions.load()));
      }
    });
    // The match can end while the leave dialog is open. Then there is nothing left to lose,
    // so the player leaves as they asked.
    effect(() => {
      if (this.leaveDialogOpen() && !this.isRunning()) {
        untracked(() => this.decideLeave(true));
      }
    });
    inject(DestroyRef).onDestroy(() => this.store.dispatch(MatchActions.left()));
  }

  // Used by the leave guard: leaving a running match counts as quitting, so the player confirms.
  confirmLeave(): Observable<boolean> | boolean {
    // A logout or an expired session navigates away too, and the dialog must never block that.
    if (!this.isRunning() || !this.signedIn()) {
      return true;
    }
    this.leaveDialogOpen.set(true);
    return this.leaveDecision$.pipe(take(1));
  }

  protected decideLeave(leave: boolean): void {
    this.leaveDialogOpen.set(false);
    this.leaveDecision$.next(leave);
  }

  protected quit(): void {
    void this.router.navigateByUrl('/home');
  }

  protected handleKey(event: KeyboardEvent): void {
    if (this.leaveDialogOpen() || hasModifier(event) || isTypingOrInDialog(event.target)) {
      return;
    }
    if (event.key === 'Escape' && this.party.chosenType()) {
      this.party.cancel();
      return;
    }
    const optionIndex = ANSWER_KEYS.indexOf(event.key);
    if (optionIndex >= 0) {
      this.answer(optionIndex);
      return;
    }
    if (NEXT_KEYS.includes(event.key) && this.phase() === 'reveal' && !isControl(event.target)) {
      event.preventDefault();
      this.next();
    }
  }

  protected answer(optionIndex: number): void {
    const question = this.question();
    const canPick =
      this.phase() === 'question' &&
      this.myAnswer() === null &&
      question !== null &&
      optionIndex < question.options.length &&
      !this.removedOptions().includes(optionIndex) &&
      optionIndex !== this.wrongTry() &&
      !this.answersPaused();
    if (canPick) {
      this.store.dispatch(MatchActions.answer({ optionIndex }));
    }
  }

  protected next(): void {
    if (this.phase() === 'reveal' && !this.nextPressed()) {
      this.store.dispatch(MatchActions.next());
    }
  }

  protected useBoost(boostType: MatchBoostType): void {
    this.store.dispatch(MatchActions.useBoost({ boostType }));
  }

  protected start(): void {
    this.store.dispatch(MatchActions.start());
  }

  protected playAgain(result: MatchResult): void {
    this.store.dispatch(MatchActions.create({ request: { quizId: result.quizId, mode: 'SOLO' } }));
  }

  protected practice(questionIds: string[]): void {
    this.store.dispatch(ReviewActions.practice({ questionIds }));
  }

  protected rematch(): void {
    this.store.dispatch(MatchActions.rematch({ matchId: this.matchId() }));
  }

  private buildFighters(): ArenaFighter[] {
    const match = this.match();
    if (!match) {
      return [];
    }
    const moment = {
      meId: this.meId(),
      scores: this.scores(),
      round: this.phase() === 'reveal' ? this.round() : null,
      answeredUserIds: this.phase() === 'question' ? this.answeredUserIds() : [],
      leftUserIds: this.leftUserIds(),
      charges: this.charges(),
      lockedOutUserIds: this.lockedOutUserIds(),
      activeSabotageByUserId: this.party.activeSabotageByUserId(),
      shieldedUserIds: this.shieldedUserIds(),
      blockedUserIds: this.party.blockedUserIds(),
    };
    return match.players.map((player) => toFighter(player, moment));
  }
}

function stageFor(phase: MatchPhase, mode: MatchMode): MatchStage {
  if (phase === 'finished' || phase === 'interrupted') {
    return phase;
  }
  if (RUNNING_PHASES.includes(phase)) {
    return 'battle';
  }
  // A solo match starts by itself right after joining, so it skips the lobby.
  return phase === 'lobby' && mode !== 'SOLO' ? 'lobby' : 'loading';
}

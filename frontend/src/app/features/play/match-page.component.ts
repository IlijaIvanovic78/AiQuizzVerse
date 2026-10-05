import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, take, timer } from 'rxjs';
import { MatchMode, MatchResult } from '../../core/models/match.model';
import { QuizKind, QuizLanguage } from '../../core/models/quiz.model';
import { RoundResultEvent } from '../../core/models/realtime-events.model';
import { MatchBoostType } from '../../core/models/shop.model';
import { ToastService } from '../../core/notifications/toast.service';
import { ReadAloudService } from '../../core/sound/read-aloud.service';
import { SoundService } from '../../core/sound/sound.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ModalComponent } from '../../shared/components/modal.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { TreasureChestComponent } from '../../shared/components/treasure-chest.component';
import { authFeature } from '../../store/auth/auth.reducer';
import { FriendsActions } from '../../store/friends/friends.actions';
import { friendsFeature } from '../../store/friends/friends.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { MatchPhase, matchFeature } from '../../store/match/match.reducer';
import { quizzesFeature } from '../../store/quizzes/quizzes.reducer';
import { ReviewActions } from '../../store/review/review.actions';
import { ArenaFighter, toFighter } from './arena-fighter';
import { AnswerGridComponent } from './components/answer-grid.component';
import { BattleArenaComponent } from './components/battle-arena.component';
import { BoostsBarComponent } from './components/boosts-bar.component';
import { CountdownOverlayComponent } from './components/countdown-overlay.component';
import { MatchHeaderComponent } from './components/match-header.component';
import { MatchLobbyComponent } from './components/match-lobby.component';
import { MatchResultsComponent } from './components/match-results.component';
import { QuestionCardComponent } from './components/question-card.component';
import { RevealPanelComponent } from './components/reveal-panel.component';
import { ScoreboardComponent } from './components/scoreboard.component';
import { TimerBarComponent } from './components/timer-bar.component';
import { MatchClockService } from './match-clock.service';
import { findPlayer } from './match-result';
import {
  ANSWER_KEYS,
  COINS_LAND_MS,
  LEVEL_UP_SOUND_DELAY_MS,
  NEXT_KEYS,
  SERBIAN_LETTERS,
  TIMER_WARNING_SECONDS,
} from './play.constants';
import { toRoundView } from './round-view';

type MatchStage = 'loading' | 'lobby' | 'battle' | 'finished' | 'interrupted';

const RUNNING_PHASES: MatchPhase[] = ['countdown', 'question', 'reveal'];

const MODE_LABELS: Record<MatchMode, string> = { SOLO: 'Solo', DUEL: 'Duel', TEAM: 'Team up' };
const KIND_LABELS: Record<QuizKind, string | null> = {
  STANDARD: null,
  PATH_STEP: 'Path step',
  REVIEW: 'Mistakes review',
};

const LEAVE_WARNINGS: Record<MatchMode, string> = {
  SOLO: 'If you leave now, this quiz stops and you get no rewards for it.',
  DUEL: 'Leaving counts as giving up, so your rival wins the duel.',
  TEAM: 'Leaving ends the team match for both of you.',
};

@Component({
  selector: 'app-match-page',
  imports: [
    RouterLink,
    AnswerGridComponent,
    BattleArenaComponent,
    BoostsBarComponent,
    CountdownOverlayComponent,
    EmptyStateComponent,
    MatchHeaderComponent,
    MatchLobbyComponent,
    MatchResultsComponent,
    ModalComponent,
    QuestionCardComponent,
    RevealPanelComponent,
    ScoreboardComponent,
    SpinnerComponent,
    TimerBarComponent,
    TreasureChestComponent,
  ],
  templateUrl: './match-page.component.html',
  providers: [MatchClockService],
  host: { '(document:keydown)': 'handleKey($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchPageComponent {
  readonly matchId = input.required<string>();

  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly sound = inject(SoundService);
  private readonly speech = inject(ReadAloudService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly origin = inject(DOCUMENT).location.origin;
  protected readonly clock = inject(MatchClockService);

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
  protected readonly result = this.store.selectSignal(matchFeature.selectResult);
  protected readonly busy = this.store.selectSignal(matchFeature.selectBusy);
  private readonly error = this.store.selectSignal(matchFeature.selectError);
  private readonly scores = this.store.selectSignal(matchFeature.selectScores);
  private readonly answeredUserIds = this.store.selectSignal(matchFeature.selectAnsweredUserIds);
  private readonly waitingForUserIds = this.store.selectSignal(
    matchFeature.selectWaitingForUserIds,
  );
  private readonly leftUserIds = this.store.selectSignal(matchFeature.selectLeftUserIds);
  private readonly user = this.store.selectSignal(authFeature.selectUser);
  private readonly signedIn = this.store.selectSignal(authFeature.selectIsAuthenticated);
  protected readonly onlineFriends = this.store.selectSignal(friendsFeature.selectOnlineFriends);
  private readonly myQuizzes = this.store.selectSignal(quizzesFeature.selectQuizEntities);
  private readonly featuredQuizzes = this.store.selectSignal(quizzesFeature.selectFeatured);

  protected readonly muted = this.sound.muted;
  protected readonly speaking = this.speech.speaking;
  protected readonly canReadAloud = this.speech.isSupported;
  protected readonly canShare = 'share' in navigator;
  protected readonly invitedIds = signal<string[]>([]);
  protected readonly leaveDialogOpen = signal(false);
  private readonly leaveDecision$ = new Subject<boolean>();

  protected readonly meId = computed(() => this.user()?.id ?? '');
  protected readonly level = computed(() => this.user()?.level ?? 1);
  protected readonly mode = computed<MatchMode>(() => this.match()?.mode ?? 'SOLO');
  protected readonly stage = computed(() => stageFor(this.phase(), this.mode()));
  private readonly isRunning = computed(() => RUNNING_PHASES.includes(this.phase()));
  private readonly isHost = computed(() => this.match()?.hostId === this.meId());

  private readonly fighters = computed(() => this.buildFighters());
  private readonly me = computed(() => this.fighters().find((fighter) => fighter.isMe) ?? null);
  private readonly others = computed(() => this.fighters().filter((fighter) => !fighter.isMe));
  // The player always stands on the left; a duel rival stands on the right.
  protected readonly meFirst = computed(() => {
    const me = this.me();
    return me ? [me, ...this.others()] : this.others();
  });
  protected readonly leftFighters = computed(() =>
    this.mode() === 'TEAM' ? this.meFirst() : this.meFirst().slice(0, 1),
  );
  protected readonly rival = computed(() =>
    this.mode() === 'DUEL' ? (this.others().at(0) ?? null) : null,
  );
  protected readonly showChest = computed(() => this.match() !== null && this.mode() !== 'DUEL');
  protected readonly chestTotal = computed(() => {
    const match = this.match();
    return match ? match.players.length * match.quiz.questionCount : 0;
  });
  // A new number every round where someone was right, which sends coins into the chest.
  protected readonly strikeKey = computed(() => {
    const round = this.round();
    const someoneCorrect = round?.players.some((player) => player.correct) ?? false;
    return this.phase() === 'reveal' && round && someoneCorrect ? round.index + 1 : 0;
  });
  protected readonly emptySide = computed(() => {
    if (this.stage() !== 'lobby' || (this.match()?.players.length ?? 0) > 1) {
      return null;
    }
    return this.mode() === 'DUEL' ? 'right' : 'left';
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

  protected readonly modeLabel = computed(() => {
    const kind = this.match()?.quiz.kind;
    const kindLabel = kind ? KIND_LABELS[kind] : null;
    return kindLabel ?? MODE_LABELS[this.mode()];
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
    if (this.phase() === 'lobby') {
      return 'Getting your quiz ready...';
    }
    return this.match()?.status === 'IN_PROGRESS'
      ? 'Rejoining your match...'
      : 'Entering the arena...';
  });
  protected readonly shareUrl = computed(
    () => `${this.origin}/join/${this.match()?.inviteCode ?? ''}`,
  );
  protected readonly leaveWarning = computed(() => LEAVE_WARNINGS[this.mode()]);
  protected readonly rivalLeft = computed(
    () => this.mode() === 'DUEL' && this.others().some((fighter) => fighter.away),
  );
  protected readonly interruptedText = computed(
    () => this.error() ?? 'This match stopped before it was finished.',
  );
  private readonly hostInLobby = computed(() => this.stage() === 'lobby' && this.isHost());
  private readonly playerNames = computed(() => {
    const names: Record<string, string> = {};
    this.match()?.players.forEach((player) => (names[player.user.id] = player.user.username));
    return names;
  });

  constructor() {
    // /play/A to /play/B reuses this page, so every new id enters its own match.
    effect(() => {
      const matchId = this.matchId();
      untracked(() => this.store.dispatch(MatchActions.entered({ matchId })));
    });
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
    effect(() => {
      this.question();
      untracked(() => this.speech.stop());
    });
    effect(() => {
      if (this.hostInLobby()) {
        untracked(() => this.store.dispatch(FriendsActions.load()));
      }
    });
    this.destroyRef.onDestroy(() => {
      this.speech.stop();
      this.store.dispatch(MatchActions.left());
    });
  }

  // Used by the leave guard: leaving a running match counts as quitting, so the player confirms.
  confirmLeave(): Observable<boolean> | boolean {
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
    const optionIndex = ANSWER_KEYS.indexOf(event.key);
    if (optionIndex >= 0) {
      this.answer(optionIndex);
      return;
    }
    // A focused button already reacts to Enter and Space by itself.
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
      !this.removedOptions().includes(optionIndex);
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

  protected inviteFriend(friendId: string): void {
    this.invitedIds.update((ids) => [...ids, friendId]);
    this.store.dispatch(MatchActions.inviteFriend({ matchId: this.matchId(), friendId }));
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

  protected toggleSound(): void {
    this.sound.toggleMuted();
  }

  protected readQuestion(): void {
    const question = this.question();
    if (question) {
      const options = question.options.map((option, index) => `${index + 1}: ${option}.`);
      this.toggleSpeech(`${question.text} ${options.join(' ')}`);
    }
  }

  protected readExplanation(): void {
    const round = this.round();
    if (round) {
      this.toggleSpeech(round.explanation);
    }
  }

  protected copyCode(): void {
    this.copyText(this.match()?.inviteCode ?? '', 'Code copied!');
  }

  protected copyLink(): void {
    this.copyText(this.shareUrl(), 'Link copied!');
  }

  protected shareLink(): void {
    const code = this.match()?.inviteCode ?? '';
    const shared = navigator.share({
      title: 'AI QuizVerse',
      text: `Join my match with the code ${code}`,
      url: this.shareUrl(),
    });
    // Closing the share sheet rejects the promise, which is not an error for the player.
    shared.catch(() => undefined);
  }

  private buildFighters(): ArenaFighter[] {
    const match = this.match();
    if (!match) {
      return [];
    }
    const moment = {
      meId: this.meId(),
      inLobby: this.phase() === 'lobby',
      scores: this.scores(),
      round: this.phase() === 'reveal' ? this.round() : null,
      answeredUserIds: this.phase() === 'question' ? this.answeredUserIds() : [],
      leftUserIds: this.leftUserIds(),
    };
    return match.players.map((player) => toFighter(player, moment));
  }

  private toggleSpeech(text: string): void {
    if (this.speaking()) {
      this.speech.stop();
      return;
    }
    this.speech.speak(text, this.speechLanguage(text));
  }

  // The match does not carry the quiz language, so it comes from the loaded quiz lists when
  // possible, and otherwise from the letters in the text.
  private speechLanguage(text: string): QuizLanguage {
    const quizId = this.match()?.quiz.id ?? '';
    const quiz =
      this.myQuizzes()[quizId] ?? this.featuredQuizzes().find((featured) => featured.id === quizId);
    if (quiz) {
      return quiz.language;
    }
    return SERBIAN_LETTERS.test(text) ? 'SR' : 'EN';
  }

  private copyText(text: string, doneMessage: string): void {
    // The clipboard API exists only on https or localhost, not on a LAN address.
    if (!navigator.clipboard) {
      this.toast.error("Copying isn't available here. Select the text and copy it yourself.");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => this.toast.success(doneMessage),
      () => this.toast.error("Copying didn't work. Select the text and copy it yourself."),
    );
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
    if (this.showChest()) {
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
      this.after(LEVEL_UP_SOUND_DELAY_MS, () => this.sound.playLevelUp());
    }
  }

  private after(ms: number, action: () => void): void {
    timer(ms).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(action);
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

function hasModifier(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.altKey || event.metaKey;
}

function isTypingOrInDialog(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest('input, textarea, select, [role="dialog"]') !== null
  );
}

function isControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('button, a') !== null;
}

import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Question } from '@prisma/client';
import {
  BehaviorSubject,
  distinct,
  filter,
  Observable,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  tap,
  timer,
  toArray,
} from 'rxjs';
import { userRoom } from '../realtime/realtime.constants';
import { NotificationsService } from '../realtime/notifications.service';
import { MatchPlayService } from './match-play.service';
import { MatchResultsService } from './match-results.service';
import {
  COUNTDOWN_SECONDS,
  EXTRA_TIME_MS,
  FIFTY_FIFTY_REMOVED_OPTIONS,
  FREE_HINTS_PER_MATCH,
  matchRoom,
  MS_PER_SECOND,
  NOT_IN_MATCH_MESSAGE,
  RETURN_GRACE_MS,
  REVEAL_MAX_MS,
} from './matches.constants';
import {
  BoostEffect,
  EndStatus,
  FinishedPlayer,
  GameServer,
  GameServerToClientEvents,
  MatchBoostType,
  MatchSummary,
  PlayerAnswerRecord,
  QuestionPayload,
  RoundPlayerResult,
  RoundResultPayload,
  SessionMatch,
  WaitingNextPayload,
} from './matches.types';
import {
  OptionOrder,
  pickWrongOptions,
  showOptions,
  shuffledOptionOrder,
  toShownIndex,
  toStoredIndex,
} from './option-order';
import { answerPoints, findWinnerIds } from './scoring';

export interface MatchSessionDeps {
  server: GameServer;
  play: MatchPlayService;
  results: MatchResultsService;
  notifications: NotificationsService;
  onClosed: (matchId: string) => void;
}

interface PlayerAnswer {
  userId: string;
  questionIndex: number;
  /** In the shuffled order the player saw; null when the player left without answering. */
  optionIndex: number | null;
  remainingMs: number;
}

interface NextPress {
  userId: string;
  questionIndex: number;
}

interface SessionPlayer {
  userId: string;
  connected: boolean;
  score: number;
  correctCount: number;
  answers: PlayerAnswerRecord[];
  freeHintsLeft: number;
  boostsThisRound: Set<MatchBoostType>;
  returnTimer: Subscription | null;
}

interface MatchEnding {
  status: EndStatus;
  forfeitedBy: string | null;
}

type Phase = 'countdown' | 'question' | 'reveal' | 'finished';

const NORMAL_END: MatchEnding = { status: 'FINISHED', forfeitedBy: null };
const ABANDONED_END: MatchEnding = { status: 'ABANDONED', forfeitedBy: null };

export class MatchSession {
  private readonly logger = new Logger(MatchSession.name);
  private readonly players = new Map<string, SessionPlayer>();
  /** One shuffled option order per question, the same for every player and rejoin. */
  private readonly optionOrders: OptionOrder[];

  private readonly answers$ = new Subject<PlayerAnswer>();
  private readonly nextPresses$ = new Subject<NextPress>();
  private readonly destroy$ = new Subject<void>();
  private readonly deadlineAt$ = new BehaviorSubject<number>(0);
  private readonly deadline$ = this.deadlineAt$.pipe(
    switchMap((deadlineAt) => timer(Math.max(0, deadlineAt - Date.now()))),
  );

  private phase: Phase = 'countdown';
  private index = 0;
  private roundPlayerIds = new Set<string>();
  private answeredUserIds = new Set<string>();
  private waitingForNext = new Set<string>();
  private lastRoundResult: RoundResultPayload | null = null;

  constructor(
    private readonly deps: MatchSessionDeps,
    private readonly match: SessionMatch,
    private readonly questions: Question[],
  ) {
    match.playerIds.forEach((userId) => this.players.set(userId, newPlayer(userId)));
    this.optionOrders = questions.map((question) => shuffledOptionOrder(question.options.length));
  }

  start(): void {
    this.emitToRoom('match:starting', {
      matchId: this.match.id,
      countdownSeconds: COUNTDOWN_SECONDS,
    });
    this.after(COUNTDOWN_SECONDS * MS_PER_SECOND, () => this.playRound(0));
  }

  hasPlayer(userId: string): boolean {
    return this.players.has(userId);
  }

  submitAnswer(userId: string, questionIndex: number, optionIndex: number): void {
    this.answers$.next({ userId, questionIndex, optionIndex, remainingMs: this.remainingMs() });
  }

  pressNext(userId: string, questionIndex: number): void {
    this.nextPresses$.next({ userId, questionIndex });
  }

  async useBoost(userId: string, type: MatchBoostType): Promise<void> {
    const player = this.requirePlayer(userId);
    this.assertCanUseBoost(player, type);
    const index = this.index;

    player.boostsThisRound.add(type);
    if (!(await this.payForBoost(player, type))) {
      player.boostsThisRound.delete(type);
      throw new WsException('You have none of this power-up left.');
    }
    const remaining = await this.remainingUses(player, type);
    if (this.phase !== 'question' || this.index !== index) {
      return;
    }
    this.emitToUser(userId, 'match:boost-used', {
      matchId: this.match.id,
      type,
      remaining,
      ...this.applyBoost(type),
    });
  }

  playerReturned(userId: string): void {
    const player = this.players.get(userId);
    if (!player || this.phase === 'finished') {
      return;
    }
    player.connected = true;
    player.returnTimer?.unsubscribe();
    player.returnTimer = null;
    this.sendCurrentState(userId);
  }

  playerDisconnected(userId: string): void {
    const player = this.players.get(userId);
    if (!player?.connected || this.phase === 'finished') {
      return;
    }
    this.markGone(player);
    if (this.match.mode !== 'SOLO') {
      this.stopWaitingFor(userId);
    }
    player.returnTimer = this.after(RETURN_GRACE_MS[this.match.mode], () => {
      void this.runSafely(() => this.dropPlayer(userId));
    });
  }

  async quit(userId: string): Promise<void> {
    const player = this.players.get(userId);
    if (!player || this.phase === 'finished') {
      return;
    }
    if (player.connected) {
      this.markGone(player);
    }
    await this.dropPlayer(userId);
  }

  stop(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private playRound(index: number): void {
    this.phase = 'question';
    this.index = index;
    this.roundPlayerIds = new Set(this.activePlayerIds());
    this.answeredUserIds.clear();
    this.players.forEach((player) => player.boostsThisRound.clear());
    this.deadlineAt$.next(Date.now() + this.timeLimitMs());

    this.collectAnswers(index)
      .pipe(takeUntil(this.destroy$))
      .subscribe((answers) => this.endRound(index, answers));
    this.emitToRoom('match:question', this.questionPayload(index));
  }

  // take() closes the round as soon as everyone has answered, takeUntil() when the time is up;
  // whichever comes first completes the stream and toArray() hands over the answers.
  private collectAnswers(index: number): Observable<PlayerAnswer[]> {
    return this.answers$.pipe(
      filter((answer) => answer.questionIndex === index && this.canAnswer(answer.userId)),
      tap((answer) => this.recordAnswer(answer)),
      take(this.expectedAnswers()),
      takeUntil(this.deadline$),
      toArray(),
    );
  }

  private canAnswer(userId: string): boolean {
    return (
      this.phase === 'question' &&
      this.roundPlayerIds.has(userId) &&
      !this.answeredUserIds.has(userId)
    );
  }

  private recordAnswer(answer: PlayerAnswer): void {
    this.answeredUserIds.add(answer.userId);
    if (answer.optionIndex !== null) {
      this.emitToRoom('match:answered', { matchId: this.match.id, userId: answer.userId });
    }
  }

  private expectedAnswers(): number {
    return this.roundPlayerIds.size;
  }

  private endRound(index: number, answers: PlayerAnswer[]): void {
    this.phase = 'reveal';
    const question = this.questions[index];
    const players = [...this.players.values()].map((player) => {
      const answer = answers.find((candidate) => candidate.userId === player.userId);
      return this.scoreAnswer(player, question, answer);
    });
    this.lastRoundResult = {
      matchId: this.match.id,
      index,
      correctIndex: toShownIndex(this.optionOrders[index], question.correctIndex),
      explanation: question.explanation,
      players,
      teamCorrect: this.teamCorrect(),
    };
    this.emitToRoom('match:round-result', this.lastRoundResult);
    this.waitForNextPresses(index);
  }

  private scoreAnswer(
    player: SessionPlayer,
    question: Question,
    answer: PlayerAnswer | undefined,
  ): RoundPlayerResult {
    const shownIndex = answer?.optionIndex ?? null;
    const order = this.optionOrders[this.index];
    const storedIndex = shownIndex === null ? null : toStoredIndex(order, shownIndex);
    const correct = storedIndex === question.correctIndex;
    const points = answerPoints(correct, answer?.remainingMs ?? 0, this.timeLimitMs());

    player.answers.push({ questionId: question.id, optionIndex: storedIndex, correct, points });
    player.score += points;
    player.correctCount += correct ? 1 : 0;
    return { userId: player.userId, optionIndex: shownIndex, correct, points, score: player.score };
  }

  private waitForNextPresses(index: number): void {
    this.waitingForNext = new Set(this.activePlayerIds());
    this.collectNextPresses(index)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.afterReveal(index));
    this.emitToRoom('match:waiting-next', this.waitingNextPayload());
  }

  private collectNextPresses(index: number): Observable<NextPress[]> {
    return this.nextPresses$.pipe(
      filter((press) => press.questionIndex === index && this.waitingForNext.has(press.userId)),
      distinct((press) => press.userId),
      tap((press) => this.markReady(press.userId)),
      take(this.waitingForNext.size),
      takeUntil(timer(REVEAL_MAX_MS[this.match.mode])),
      toArray(),
    );
  }

  private markReady(userId: string): void {
    this.waitingForNext.delete(userId);
    this.emitToRoom('match:waiting-next', this.waitingNextPayload());
  }

  private afterReveal(index: number): void {
    if (index + 1 < this.questions.length) {
      this.playRound(index + 1);
      return;
    }
    void this.runSafely(() => this.finish(NORMAL_END));
  }

  private assertCanUseBoost(player: SessionPlayer, type: MatchBoostType): void {
    if (this.match.mode === 'DUEL') {
      throw new WsException('Power-ups are off in duels. Fair fight!');
    }
    if (!this.canAnswer(player.userId)) {
      throw new WsException('Power-ups work only before you answer.');
    }
    if (player.boostsThisRound.has(type)) {
      throw new WsException('You already used this power-up on this question.');
    }
  }

  private async payForBoost(player: SessionPlayer, type: MatchBoostType): Promise<boolean> {
    if (type === 'HINT' && player.freeHintsLeft > 0) {
      player.freeHintsLeft -= 1;
      return true;
    }
    return this.deps.play.spendBoost(player.userId, type);
  }

  private async remainingUses(player: SessionPlayer, type: MatchBoostType): Promise<number> {
    const owned = await this.deps.play.ownedBoosts(player.userId, type);
    return type === 'HINT' ? owned + player.freeHintsLeft : owned;
  }

  private applyBoost(type: MatchBoostType): BoostEffect {
    const question = this.questions[this.index];
    if (type === 'HINT') {
      return { hint: question.hint };
    }
    if (type === 'FIFTY_FIFTY') {
      const order = this.optionOrders[this.index];
      const correct = question.correctIndex;
      return { eliminatedOptions: pickWrongOptions(order, correct, FIFTY_FIFTY_REMOVED_OPTIONS) };
    }
    return { remainingMs: this.extendDeadline() };
  }

  private extendDeadline(): number {
    this.deadlineAt$.next(this.deadlineAt$.value + EXTRA_TIME_MS);
    const remainingMs = this.remainingMs();
    this.emitToRoom('match:deadline', { matchId: this.match.id, index: this.index, remainingMs });
    return remainingMs;
  }

  private markGone(player: SessionPlayer): void {
    player.connected = false;
    if (this.match.mode !== 'SOLO') {
      this.emitToRoom('match:player-left', { matchId: this.match.id, userId: player.userId });
    }
  }

  /** A player who left gives up the open question and the Next press, so the others can go on. */
  private stopWaitingFor(userId: string): void {
    if (this.phase === 'question') {
      this.answers$.next({ userId, questionIndex: this.index, optionIndex: null, remainingMs: 0 });
    }
    if (this.phase === 'reveal') {
      this.nextPresses$.next({ userId, questionIndex: this.index });
    }
  }

  private async dropPlayer(userId: string): Promise<void> {
    if (this.match.mode === 'DUEL') {
      await this.finish({ status: 'FINISHED', forfeitedBy: userId });
      return;
    }
    await this.finish(ABANDONED_END);
  }

  private async finish(ending: MatchEnding): Promise<void> {
    if (this.phase === 'finished') {
      return;
    }
    this.phase = 'finished';
    this.destroy$.next();
    try {
      const finishedPlayers = await this.deps.results.save(this.summarize(ending));
      finishedPlayers.forEach((player) => this.announceResult(player));
    } catch (error) {
      this.logger.error(`Could not save match ${this.match.id}`, (error as Error).stack);
      this.emitToRoom('match:error', {
        matchId: this.match.id,
        message: 'We could not save this match. Sorry!',
      });
    } finally {
      this.stop();
      this.deps.onClosed(this.match.id);
    }
  }

  private summarize(ending: MatchEnding): MatchSummary {
    const winnerIds = this.winnerIds(ending);
    return {
      match: this.match,
      status: ending.status,
      questions: this.questions,
      players: [...this.players.values()].map((player) => ({
        userId: player.userId,
        score: player.score,
        correctCount: player.correctCount,
        isWinner: winnerIds.includes(player.userId),
        answers: player.answers,
        rewarded: ending.status === 'FINISHED' || player.connected,
      })),
    };
  }

  private winnerIds(ending: MatchEnding): string[] {
    if (ending.status === 'ABANDONED') {
      return [];
    }
    if (ending.forfeitedBy) {
      return this.match.playerIds.filter((userId) => userId !== ending.forfeitedBy);
    }
    return findWinnerIds(this.match.mode, [...this.players.values()], this.questions.length);
  }

  private announceResult({ userId, result, coins }: FinishedPlayer): void {
    this.emitToUser(userId, 'match:finished', result);
    this.deps.notifications.emitToUser(userId, 'coins:updated', { coins });
  }

  private sendCurrentState(userId: string): void {
    if (this.phase === 'question') {
      this.emitToUser(userId, 'match:question', this.questionPayload(this.index));
    }
    if (this.phase === 'reveal' && this.lastRoundResult) {
      this.emitToUser(userId, 'match:round-result', this.lastRoundResult);
      this.emitToUser(userId, 'match:waiting-next', this.waitingNextPayload());
    }
  }

  // When nobody is connected everyone counts, so rounds run out their timer
  // instead of racing past.
  private activePlayerIds(): string[] {
    const connected = [...this.players.values()].filter((player) => player.connected);
    const active = connected.length > 0 ? connected : [...this.players.values()];
    return active.map((player) => player.userId);
  }

  private questionPayload(index: number): QuestionPayload {
    const question = this.questions[index];
    return {
      matchId: this.match.id,
      index,
      total: this.questions.length,
      text: question.text,
      options: showOptions(question.options, this.optionOrders[index]),
      timeLimitSeconds: this.match.quiz.timePerQuestion,
      remainingMs: this.remainingMs(),
    };
  }

  private waitingNextPayload(): WaitingNextPayload {
    return { matchId: this.match.id, userIds: [...this.waitingForNext] };
  }

  private teamCorrect(): number {
    return [...this.players.values()].reduce((sum, player) => sum + player.correctCount, 0);
  }

  private timeLimitMs(): number {
    return this.match.quiz.timePerQuestion * MS_PER_SECOND;
  }

  private remainingMs(): number {
    return Math.max(0, this.deadlineAt$.value - Date.now());
  }

  private requirePlayer(userId: string): SessionPlayer {
    const player = this.players.get(userId);
    if (!player) {
      throw new WsException(NOT_IN_MATCH_MESSAGE);
    }
    return player;
  }

  private after(ms: number, action: () => void): Subscription {
    return timer(ms).pipe(takeUntil(this.destroy$)).subscribe(action);
  }

  private async runSafely(task: () => Promise<void>): Promise<void> {
    try {
      await task();
    } catch (error) {
      this.logger.error(`Match ${this.match.id} failed`, (error as Error).stack);
    }
  }

  private emitToRoom<E extends keyof GameServerToClientEvents>(
    event: E,
    ...payload: Parameters<GameServerToClientEvents[E]>
  ): void {
    this.deps.server.to(matchRoom(this.match.id)).emit(event, ...payload);
  }

  private emitToUser<E extends keyof GameServerToClientEvents>(
    userId: string,
    event: E,
    ...payload: Parameters<GameServerToClientEvents[E]>
  ): void {
    this.deps.server.to(userRoom(userId)).emit(event, ...payload);
  }
}

function newPlayer(userId: string): SessionPlayer {
  return {
    userId,
    connected: true,
    score: 0,
    correctCount: 0,
    answers: [],
    freeHintsLeft: FREE_HINTS_PER_MATCH,
    boostsThisRound: new Set(),
    returnTimer: null,
  };
}

import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Question } from '@prisma/client';
import {
  BehaviorSubject,
  filter,
  Observable,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  tap,
  timer,
  toArray,
} from 'rxjs';
import { errorStack } from '../../common/utils/errors';
import { userRoom } from '../realtime/realtime.constants';
import { NotificationsService } from '../realtime/notifications.service';
import { MatchPlayService } from './match-play.service';
import { MatchResultsService } from './match-results.service';
import {
  COUNTDOWN_SECONDS,
  EXTRA_TIME_MS,
  FIFTY_FIFTY_REMOVED_OPTIONS,
  FREEZE_DURATION_MS,
  matchRoom,
  MIN_PARTY_PLAYERS,
  MS_PER_SECOND,
  NOT_IN_MATCH_MESSAGE,
  RETURN_GRACE_MS,
  REVEAL_MAX_MS,
  SABOTAGE_DURATION_MS,
} from './matches.constants';
import {
  BoostEffect,
  EndStatus,
  FinishedPlayer,
  GameServer,
  GameServerToClientEvents,
  LivePlayerStats,
  MatchBoostType,
  MatchSummary,
  PlayedRound,
  QuestionPayload,
  SabotagePayload,
  SabotageType,
  ScoredAnswer,
  SessionMatch,
  WaitingNextPayload,
} from './matches.types';
import { toRoundResult } from './match.mapper';
import {
  MatchOptionOrders,
  OptionOrder,
  pickWrongOptions,
  showOptions,
  toStoredIndex,
} from './option-order';
import { chargesAfterRoundWin, SabotageAttempt, sabotageError } from './party-rules';
import { answerPoints, findWinnerIds, secondTryPoints, wrongPartyAnswerPoints } from './scoring';
import { newPlayer, resetRoundState, SessionPlayer } from './session-player';

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

type Phase = 'countdown' | 'question' | 'reveal' | 'finished';

export class MatchSession {
  private readonly logger = new Logger(MatchSession.name);
  private readonly players = new Map<string, SessionPlayer>();
  private readonly optionOrders: MatchOptionOrders;

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
  private lastRound: PlayedRound | null = null;
  private smallPartyTimer: Subscription | null = null;

  constructor(
    private readonly deps: MatchSessionDeps,
    private readonly match: SessionMatch,
    private readonly questions: Question[],
  ) {
    match.players.forEach((player) => {
      this.players.set(player.userId, newPlayer(player, match.mode));
    });
    this.optionOrders = new MatchOptionOrders(questions.map((question) => question.options.length));
  }

  /** Players who are not here when the match starts count as gone from the first question. */
  start(connectedUserIds: string[]): void {
    this.emitToRoom('match:starting', {
      matchId: this.match.id,
      countdownSeconds: COUNTDOWN_SECONDS,
    });
    this.players.forEach((player) => {
      if (!connectedUserIds.includes(player.userId)) {
        this.playerDisconnected(player.userId);
      }
    });
    this.after(COUNTDOWN_SECONDS * MS_PER_SECOND, () => this.playRound(0));
  }

  hasPlayer(userId: string): boolean {
    return this.players.has(userId);
  }

  liveStats(): LivePlayerStats[] {
    return [...this.players.values()].map(({ userId, score, correctCount, charges }) => ({
      userId,
      score,
      correctCount,
      charges,
    }));
  }

  submitAnswer(userId: string, questionIndex: number, optionIndex: number): void {
    if (this.isFrozen(userId)) {
      throw new WsException('You are frozen!');
    }
    const answer = { userId, questionIndex, optionIndex, remainingMs: this.remainingMs() };
    if (this.secondChanceCovers(answer)) {
      this.offerSecondTry(userId, optionIndex);
      return;
    }
    this.answers$.next(answer);
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
      ...this.applyBoost(player, type),
    });
  }

  sabotage(userId: string, type: SabotageType, targetUserId?: string): void {
    const player = this.requirePlayer(userId);
    const target = type === 'SHIELD' ? player : this.findPlayer(targetUserId);
    const error = sabotageError(this.sabotageAttempt(player, type, target));
    if (error !== null || !target) {
      throw new WsException(error ?? NOT_IN_MATCH_MESSAGE);
    }

    player.charges -= 1;
    player.sabotagedThisRound = true;
    const sabotage = this.sabotagePayload(player, target, type);
    if (target.shielded) {
      target.shielded = false;
      this.emitToRoom('match:sabotage-blocked', sabotage);
      return;
    }
    this.emitToRoom('match:sabotaged', { ...sabotage, durationMs: SABOTAGE_DURATION_MS[type] });
    this.applySabotage(target, type);
  }

  playerReturned(userId: string): void {
    const player = this.players.get(userId);
    if (!player || this.phase === 'finished') {
      return;
    }
    player.connected = true;
    player.returnTimer?.unsubscribe();
    player.returnTimer = null;
    if (this.match.mode === 'PARTY') {
      this.watchPartySize();
    }
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
    if (this.match.mode === 'PARTY') {
      this.watchPartySize();
      return;
    }
    player.returnTimer = this.after(RETURN_GRACE_MS[this.match.mode], () => {
      void this.runSafely(() => this.afterPlayerLeft());
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
    // A solo or team match ends right below, so only a party has to stop waiting for this player.
    if (this.match.mode === 'PARTY') {
      this.stopWaitingFor(userId);
    }
    await this.afterPlayerLeft();
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
    this.players.forEach((player) => resetRoundState(player));
    this.deadlineAt$.next(Date.now() + this.timeLimitMs());

    this.collectAnswers(index)
      .pipe(takeUntil(this.destroy$))
      .subscribe((answers) => this.endRound(index, answers));
    this.emitToRoom('match:question', this.questionPayload(index, this.optionOrders.shared(index)));
  }

  // take() ends the round once everyone has answered and takeUntil() when the time is up.
  // In a party takeWhile() ends it on the first correct answer; `true` keeps that answer.
  private collectAnswers(index: number): Observable<PlayerAnswer[]> {
    return this.answers$.pipe(
      filter((answer) => answer.questionIndex === index && this.canAnswer(answer.userId)),
      tap((answer) => this.recordAnswer(answer)),
      takeWhile((answer) => !this.winsPartyRound(answer), true),
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
    if (answer.optionIndex === null) {
      return;
    }
    const { userId, questionIndex } = answer;
    this.emitToRoom('match:answered', { matchId: this.match.id, userId });
    if (this.match.mode === 'PARTY' && !this.isCorrect(answer)) {
      this.emitToRoom('match:locked-out', { matchId: this.match.id, index: questionIndex, userId });
    }
  }

  private expectedAnswers(): number {
    return this.roundPlayerIds.size;
  }

  private winsPartyRound(answer: PlayerAnswer): boolean {
    return this.match.mode === 'PARTY' && this.isCorrect(answer);
  }

  private isCorrect(answer: PlayerAnswer): boolean {
    return this.storedOption(answer) === this.questions[answer.questionIndex].correctIndex;
  }

  /** The answer in the stored option order, or null when the player gave none. */
  private storedOption(answer: PlayerAnswer | undefined): number | null {
    if (!answer || answer.optionIndex === null) {
      return null;
    }
    const order = this.optionOrders.forPlayer(answer.userId, answer.questionIndex);
    return toStoredIndex(order, answer.optionIndex);
  }

  private endRound(index: number, answers: PlayerAnswer[]): void {
    this.phase = 'reveal';
    const winner = answers.find((answer) => this.winsPartyRound(answer));
    const players = [...this.players.values()].map((player) => {
      const answer = answers.find((candidate) => candidate.userId === player.userId);
      return this.scoreAnswer(player, answer, index);
    });
    this.lastRound = {
      index,
      winnerUserId: winner?.userId ?? null,
      players,
      teamCorrect: this.teamCorrect(),
    };
    this.players.forEach((player) => this.sendRoundResult(player.userId));
    this.waitForNextPresses(index);
  }

  private scoreAnswer(
    player: SessionPlayer,
    answer: PlayerAnswer | undefined,
    index: number,
  ): ScoredAnswer {
    const question = this.questions[index];
    const storedIndex = this.storedOption(answer);
    const correct = storedIndex === question.correctIndex;
    const points = this.pointsFor(player, answer, correct);

    player.answers.push({ questionId: question.id, optionIndex: storedIndex, correct, points });
    player.score += points;
    player.correctCount += correct ? 1 : 0;
    if (correct && this.match.mode === 'PARTY') {
      player.charges = chargesAfterRoundWin(player.charges);
    }
    const { userId, score, charges } = player;
    return { userId, storedIndex, correct, points, score, charges };
  }

  /** A wrong party answer costs points; an answer after a second chance has no speed bonus. */
  private pointsFor(
    player: SessionPlayer,
    answer: PlayerAnswer | undefined,
    correct: boolean,
  ): number {
    const answered = answer !== undefined && answer.optionIndex !== null;
    if (this.match.mode === 'PARTY' && answered && !correct) {
      return wrongPartyAnswerPoints(player.score);
    }
    if (player.secondChance === 'spent') {
      return secondTryPoints(correct);
    }
    return answerPoints(correct, answer?.remainingMs ?? 0, this.timeLimitMs());
  }

  /** Sent per player, because after a SCRAMBLE players see the options in different orders. */
  private sendRoundResult(userId: string): void {
    if (!this.lastRound) {
      return;
    }
    const { index } = this.lastRound;
    const order = this.optionOrders.forPlayer(userId, index);
    const result = toRoundResult(this.match.id, this.questions[index], order, this.lastRound);
    this.emitToUser(userId, 'match:round-result', result);
  }

  private waitForNextPresses(index: number): void {
    this.waitingForNext = new Set(this.activePlayerIds());
    this.collectNextPresses(index)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.afterReveal(index));
    this.emitToRoom('match:waiting-next', this.waitingNextPayload());
  }

  // The filter also drops a second press from the same player, because markReady() takes
  // that player out of waitingForNext.
  private collectNextPresses(index: number): Observable<NextPress[]> {
    return this.nextPresses$.pipe(
      filter((press) => press.questionIndex === index && this.waitingForNext.has(press.userId)),
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
    void this.runSafely(() => this.finish('FINISHED', this.winnerIdsByScore()));
  }

  private assertCanUseBoost(player: SessionPlayer, type: MatchBoostType): void {
    if (this.match.mode === 'PARTY') {
      throw new WsException('Power-ups are off in party matches. Fair fight!');
    }
    if (this.phase === 'countdown') {
      throw new WsException('Wait for the question to start.');
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

  private applyBoost(player: SessionPlayer, type: MatchBoostType): BoostEffect {
    const question = this.questions[this.index];
    switch (type) {
      case 'HINT':
        return { hint: question.hint };
      case 'FIFTY_FIFTY': {
        const order = this.optionOrders.forPlayer(player.userId, this.index);
        const correct = question.correctIndex;
        return { eliminatedOptions: pickWrongOptions(order, correct, FIFTY_FIFTY_REMOVED_OPTIONS) };
      }
      case 'SECOND_CHANCE':
        player.secondChance = 'armed';
        return {};
      case 'EXTRA_TIME':
        return { remainingMs: this.extendDeadline() };
    }
  }

  private extendDeadline(): number {
    this.deadlineAt$.next(this.deadlineAt$.value + EXTRA_TIME_MS);
    const remainingMs = this.remainingMs();
    this.emitToRoom('match:deadline', { matchId: this.match.id, index: this.index, remainingMs });
    return remainingMs;
  }

  /** With a second chance armed, a wrong answer to the open question does not count yet. */
  private secondChanceCovers(answer: PlayerAnswer): boolean {
    return (
      this.requirePlayer(answer.userId).secondChance === 'armed' &&
      answer.questionIndex === this.index &&
      this.canAnswer(answer.userId) &&
      !this.isCorrect(answer)
    );
  }

  private offerSecondTry(userId: string, wrongOption: number): void {
    this.requirePlayer(userId).secondChance = 'spent';
    this.emitToUser(userId, 'match:second-chance', {
      matchId: this.match.id,
      index: this.index,
      wrongOption,
    });
  }

  private sabotageAttempt(
    player: SessionPlayer,
    type: SabotageType,
    target: SessionPlayer | undefined,
  ): SabotageAttempt {
    return {
      mode: this.match.mode,
      type,
      owned: player.sabotages.includes(type),
      questionOpen: this.phase === 'question',
      fromUserId: player.userId,
      charges: player.charges,
      alreadySabotaged: player.sabotagedThisRound,
      target: target
        ? {
            userId: target.userId,
            connected: target.connected,
            canAnswer: this.canAnswer(target.userId),
          }
        : null,
    };
  }

  private sabotagePayload(
    from: SessionPlayer,
    target: SessionPlayer,
    type: SabotageType,
  ): SabotagePayload {
    return {
      matchId: this.match.id,
      index: this.index,
      type,
      fromUserId: from.userId,
      targetUserId: target.userId,
      fromCharges: from.charges,
    };
  }

  /** INK, FOG, QUAKE and MIRROR only need the match:sabotaged event: the clients draw them. */
  private applySabotage(target: SessionPlayer, type: SabotageType): void {
    if (type === 'FREEZE') {
      target.frozenUntil = Date.now() + FREEZE_DURATION_MS;
    }
    if (type === 'SCRAMBLE') {
      this.scrambleOptions(target);
    }
    if (type === 'SHIELD') {
      target.shielded = true;
    }
  }

  private scrambleOptions(target: SessionPlayer): void {
    const order = this.optionOrders.scramble(target.userId, this.index);
    this.emitToUser(target.userId, 'match:options', {
      matchId: this.match.id,
      index: this.index,
      options: showOptions(this.questions[this.index].options, order),
    });
  }

  private isFrozen(userId: string): boolean {
    const player = this.players.get(userId);
    return player !== undefined && player.frozenUntil > Date.now();
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

  /** A party may go on without the player; a solo or team match cannot. */
  private async afterPlayerLeft(): Promise<void> {
    if (this.match.mode === 'PARTY') {
      await this.endPartyIfTooSmall();
      return;
    }
    await this.finish('ABANDONED', []);
  }

  // A party goes on without the players who left while at least two are still here.
  // With fewer, the others get the usual grace time to come back before it ends.
  private watchPartySize(): void {
    if (this.connectedPlayerIds().length >= MIN_PARTY_PLAYERS) {
      this.smallPartyTimer?.unsubscribe();
      this.smallPartyTimer = null;
      return;
    }
    this.smallPartyTimer ??= this.after(RETURN_GRACE_MS.PARTY, () => {
      void this.runSafely(() => this.endPartyIfTooSmall());
    });
  }

  /** The last player still here wins the party; with nobody left it is abandoned. */
  private async endPartyIfTooSmall(): Promise<void> {
    const connectedIds = this.connectedPlayerIds();
    if (connectedIds.length >= MIN_PARTY_PLAYERS) {
      return;
    }
    if (connectedIds.length === 1) {
      await this.finish('FINISHED', connectedIds);
      return;
    }
    await this.finish('ABANDONED', []);
  }

  private sendCurrentState(userId: string): void {
    if (this.phase === 'question') {
      const order = this.optionOrders.forPlayer(userId, this.index);
      this.emitToUser(userId, 'match:question', this.questionPayload(this.index, order));
      // Leaving gave up this question, so the page waits for the next one instead of
      // taking an answer that would not count.
      if (!this.canAnswer(userId)) {
        this.emitToUser(userId, 'match:answered', { matchId: this.match.id, userId });
      }
    }
    if (this.phase === 'reveal') {
      this.sendRoundResult(userId);
      this.emitToUser(userId, 'match:waiting-next', this.waitingNextPayload());
    }
  }

  private async finish(status: EndStatus, winnerIds: string[]): Promise<void> {
    if (this.phase === 'finished') {
      return;
    }
    this.phase = 'finished';
    this.stop();
    try {
      const finishedPlayers = await this.deps.results.save(this.summarize(status, winnerIds));
      finishedPlayers.forEach((player) => this.announceResult(player));
    } catch (error) {
      this.logger.error(`Could not save match ${this.match.id}`, errorStack(error));
      this.emitToRoom('match:error', {
        matchId: this.match.id,
        message: 'We could not save this match. Sorry!',
      });
    } finally {
      this.deps.onClosed(this.match.id);
    }
  }

  private winnerIdsByScore(): string[] {
    const rankedPlayers = [...this.players.values()].filter((player) => this.isRanked(player));
    return findWinnerIds(this.match.mode, rankedPlayers, this.questions.length);
  }

  // Leaving a party counts as giving up: the player keeps the points for their answers,
  // but only the players still here can win or draw.
  private isRanked(player: SessionPlayer): boolean {
    return this.match.mode !== 'PARTY' || player.connected;
  }

  private summarize(status: EndStatus, winnerIds: string[]): MatchSummary {
    return {
      match: this.match,
      status,
      questions: this.questions,
      players: [...this.players.values()].map((player) => ({
        userId: player.userId,
        score: player.score,
        correctCount: player.correctCount,
        isWinner: winnerIds.includes(player.userId),
        ranked: this.isRanked(player),
        answers: player.answers,
        rewarded: status === 'FINISHED' || player.connected,
      })),
    };
  }

  private announceResult({ userId, result, coins }: FinishedPlayer): void {
    this.emitToUser(userId, 'match:finished', result);
    this.deps.notifications.emitToUser(userId, 'coins:updated', { coins });
    result.chestsEarned.forEach((chest) => {
      this.deps.notifications.emitToUser(userId, 'chest:earned', { chest });
    });
  }

  private connectedPlayerIds(): string[] {
    return [...this.players.values()]
      .filter((player) => player.connected)
      .map((player) => player.userId);
  }

  // When nobody is connected everyone counts, so rounds run out their timer
  // instead of racing past.
  private activePlayerIds(): string[] {
    const connected = this.connectedPlayerIds();
    return connected.length > 0 ? connected : [...this.players.keys()];
  }

  private questionPayload(index: number, order: OptionOrder): QuestionPayload {
    const question = this.questions[index];
    return {
      matchId: this.match.id,
      index,
      total: this.questions.length,
      text: question.text,
      options: showOptions(question.options, order),
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

  private findPlayer(userId: string | undefined): SessionPlayer | undefined {
    return userId === undefined ? undefined : this.players.get(userId);
  }

  private after(ms: number, action: () => void): Subscription {
    return timer(ms).pipe(takeUntil(this.destroy$)).subscribe(action);
  }

  private async runSafely(task: () => Promise<void>): Promise<void> {
    try {
      await task();
    } catch (error) {
      this.logger.error(`Match ${this.match.id} failed`, errorStack(error));
    }
  }

  // In both emit helpers the payload type follows the event name, so a wrong payload does not
  // compile.
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

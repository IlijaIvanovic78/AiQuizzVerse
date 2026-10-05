import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import {
  Observable,
  catchError,
  concatMap,
  exhaustMap,
  filter,
  map,
  merge,
  of,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { readErrorMessage } from '../../core/api/api-error';
import { MatchesApiService } from '../../core/api/matches-api.service';
import { MatchMode, MatchView } from '../../core/models/match.model';
import { ToastService } from '../../core/notifications/toast.service';
import { MatchSocketService } from '../../core/realtime/match-socket.service';
import { authFeature } from '../auth/auth.reducer';
import { ShopActions } from '../shop/shop.actions';
import { MatchSocketActions } from './match-socket.actions';
import { MatchActions } from './match.actions';
import { MatchState, matchFeature } from './match.reducer';

@Injectable()
export class MatchEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly matchesApi = inject(MatchesApiService);
  private readonly matchSocket = inject(MatchSocketService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.create),
      exhaustMap(({ request }) =>
        this.matchesApi.create(request).pipe(
          map((match) => MatchActions.opened({ match })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly join$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.join),
      exhaustMap(({ inviteCode }) =>
        this.matchesApi.join({ inviteCode }).pipe(
          map((match) => MatchActions.opened({ match })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly rematch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.rematch),
      exhaustMap(({ matchId }) =>
        this.matchesApi.rematch(matchId).pipe(
          map((match) => MatchActions.opened({ match })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly acceptInvite$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.inviteAccepted),
      map(({ invite }) => MatchActions.join({ inviteCode: invite.inviteCode })),
    ),
  );

  readonly goToMatch$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.opened),
        tap(({ match }) => void this.router.navigate(['/play', match.id])),
      ),
    { dispatch: false },
  );

  // A response that arrives after the player left must not join the room, because joining
  // starts a solo match.
  readonly loadMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.entered),
      switchMap(({ matchId }) =>
        this.matchesApi.get(matchId).pipe(
          map((match) => MatchActions.loaded({ match })),
          catchError((error: unknown) => of(this.failed(error))),
          takeUntil(this.actions$.pipe(ofType(MatchActions.left))),
        ),
      ),
    ),
  );

  readonly joinMatchRoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.loaded),
        filter(({ match }) => isStillPlaying(match)),
        tap(({ match }) => this.matchSocket.enter(match.id)),
      ),
    { dispatch: false },
  );

  readonly loadFinishedResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.loaded),
      filter(({ match }) => match.status === 'FINISHED'),
      switchMap(({ match }) =>
        this.matchesApi.result(match.id).pipe(
          map((result) => MatchActions.resultLoaded({ result })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly loadBoosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.loaded),
      filter(({ match }) => isStillPlaying(match) && hasPowerUps(match.mode)),
      map(() => ShopActions.loadBoosts()),
    ),
  );

  // Socket events reach the store only while the match page is open.
  readonly socketEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.entered),
      switchMap(({ matchId }) =>
        this.matchEvents(matchId).pipe(takeUntil(this.actions$.pipe(ofType(MatchActions.left)))),
      ),
    ),
  );

  readonly leave$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.left),
        tap(() => this.matchSocket.leave()),
      ),
    { dispatch: false },
  );

  readonly start$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.start),
        withLatestFrom(this.store.select(matchFeature.selectMatchId)),
        tap(([, matchId]) => {
          if (matchId) {
            this.matchSocket.start(matchId);
          }
        }),
      ),
    { dispatch: false },
  );

  readonly answer$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.answer),
        withLatestFrom(this.store.select(matchFeature.selectMatchState)),
        filter(([{ optionIndex }, state]) => isAcceptedAnswer(state, optionIndex)),
        tap(([{ optionIndex }, state]) => {
          if (state.matchId && state.question) {
            this.matchSocket.answer(state.matchId, state.question.index, optionIndex);
          }
        }),
      ),
    { dispatch: false },
  );

  // The server accepts a freeze only on a player who has not answered yet. So when a freeze on
  // me arrives, my answer that was still on its way was refused, and I can pick again later.
  readonly refuseFrozenAnswer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchSocketActions.playerSabotaged),
      withLatestFrom(this.store.select(authFeature.selectUser)),
      filter(
        ([{ sabotage }, user]) => sabotage.type === 'FREEZE' && sabotage.targetUserId === user?.id,
      ),
      map(([{ sabotage }]) => MatchActions.answerRefused({ index: sabotage.index })),
    ),
  );

  readonly next$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.next),
        withLatestFrom(this.store.select(matchFeature.selectMatchState)),
        tap(([, state]) => {
          if (state.matchId && state.round) {
            this.matchSocket.next(state.matchId, state.round.index);
          }
        }),
      ),
    { dispatch: false },
  );

  readonly useBoost$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.useBoost),
        withLatestFrom(this.store.select(matchFeature.selectMatchId)),
        tap(([{ boostType }, matchId]) => {
          if (matchId) {
            this.matchSocket.useBoost(matchId, boostType);
          }
        }),
      ),
    { dispatch: false },
  );

  readonly sabotage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.sabotage),
        withLatestFrom(this.store.select(matchFeature.selectMatchId)),
        tap(([{ targetUserId, sabotageType }, matchId]) => {
          if (matchId) {
            this.matchSocket.sabotage(matchId, targetUserId, sabotageType);
          }
        }),
      ),
    { dispatch: false },
  );

  readonly inviteFriend$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.inviteFriend),
      concatMap(({ matchId, friendId }) =>
        this.matchesApi.invite(matchId, { friendId }).pipe(
          map(() => MatchActions.friendInvited()),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );

  readonly announceInvite$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.friendInvited),
        tap(() => this.toast.success('Invite sent!')),
      ),
    { dispatch: false },
  );

  readonly showError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MatchActions.failed, MatchSocketActions.errorReceived),
        tap(({ error }) => this.toast.error(error)),
      ),
    { dispatch: false },
  );

  private matchEvents(matchId: string): Observable<Action> {
    const socket = this.matchSocket;

    const lobby$ = socket.lobby$.pipe(
      filter((match) => match.id === matchId),
      map((match) => MatchSocketActions.lobbyUpdated({ match })),
    );
    const starting$ = socket.starting$.pipe(
      filter((event) => event.matchId === matchId),
      map(({ countdownSeconds }) => MatchSocketActions.countdownStarted({ countdownSeconds })),
    );
    const question$ = socket.question$.pipe(
      filter((event) => event.matchId === matchId),
      map((question) =>
        MatchSocketActions.questionReceived({
          question,
          deadlineAt: deadlineFrom(question.remainingMs),
        }),
      ),
    );
    const answered$ = socket.answered$.pipe(
      filter((event) => event.matchId === matchId),
      map(({ userId }) => MatchSocketActions.playerAnswered({ userId })),
    );
    const deadline$ = socket.deadline$.pipe(
      filter((event) => event.matchId === matchId),
      map(({ remainingMs }) =>
        MatchSocketActions.deadlineChanged({ deadlineAt: deadlineFrom(remainingMs) }),
      ),
    );
    const roundResult$ = socket.roundResult$.pipe(
      filter((event) => event.matchId === matchId),
      map((round) => MatchSocketActions.roundFinished({ round })),
    );
    const waitingNext$ = socket.waitingNext$.pipe(
      filter((event) => event.matchId === matchId),
      map(({ userIds }) => MatchSocketActions.waitingForNext({ userIds })),
    );
    const boostUsed$ = socket.boostUsed$.pipe(
      filter((event) => event.matchId === matchId),
      map((boost) =>
        MatchSocketActions.boostUsed({
          boost,
          deadlineAt: boost.remainingMs === undefined ? null : deadlineFrom(boost.remainingMs),
        }),
      ),
    );
    const lockedOut$ = socket.lockedOut$.pipe(
      filter((event) => event.matchId === matchId),
      map(({ index, userId }) => MatchSocketActions.playerLockedOut({ index, userId })),
    );
    const options$ = socket.options$.pipe(
      filter((event) => event.matchId === matchId),
      map(({ index, options }) => MatchSocketActions.optionsScrambled({ index, options })),
    );
    const sabotaged$ = socket.sabotaged$.pipe(
      filter((event) => event.matchId === matchId),
      map((sabotage) => MatchSocketActions.playerSabotaged({ sabotage, landedAt: Date.now() })),
    );
    const finished$ = socket.finished$.pipe(
      filter((event) => event.matchId === matchId),
      map((result) => MatchSocketActions.finished({ result })),
    );
    const playerLeft$ = socket.playerLeft$.pipe(
      filter((event) => event.matchId === matchId),
      map(({ userId }) => MatchSocketActions.playerLeft({ userId })),
    );
    const error$ = socket.error$.pipe(
      map(({ message }) => MatchSocketActions.errorReceived({ error: message })),
    );

    return merge(
      lobby$,
      starting$,
      question$,
      answered$,
      deadline$,
      roundResult$,
      waitingNext$,
      boostUsed$,
      lockedOut$,
      options$,
      sabotaged$,
      finished$,
      playerLeft$,
      error$,
    );
  }

  private failed(error: unknown) {
    return MatchActions.failed({ error: readErrorMessage(error) });
  }
}

// The reducer keeps only the first pick of a round, so clicks on other options are not sent.
function isAcceptedAnswer(state: MatchState, optionIndex: number): boolean {
  return state.phase === 'question' && state.myAnswer === optionIndex;
}

// Duels and parties are fair fights, so the power-ups are off there.
function hasPowerUps(mode: MatchMode): boolean {
  return mode === 'SOLO' || mode === 'TEAM';
}

function isStillPlaying(match: MatchView): boolean {
  return match.status === 'WAITING' || match.status === 'IN_PROGRESS';
}

// The server sends time left, not a clock time, so the deadline is fixed on this device's clock.
function deadlineFrom(remainingMs: number): number {
  return Date.now() + remainingMs;
}

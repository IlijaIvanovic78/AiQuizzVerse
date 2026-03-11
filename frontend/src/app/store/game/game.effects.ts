import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { Router } from '@angular/router';
import { GameActions } from './game.actions';
import { GameApiService, SocketService, ToastService } from '../../services';
import { selectUserId } from '../auth/auth.selectors';

@Injectable()
export class GameEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private gameApi = inject(GameApiService);
  private socketService = inject(SocketService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // ─── HTTP effects ─────────────────────────────────────────

  createMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.createMatch),
      switchMap(({ quizId, matchType }) =>
        this.gameApi.createMatch(quizId, matchType).pipe(
          map((match) => GameActions.createMatchSuccess({ match })),
          catchError((error) =>
            of(GameActions.createMatchFailure({ error: error?.error?.message || error.message }))
          )
        )
      )
    )
  );

  createMatchSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.createMatchSuccess),
        tap(({ match }) => {
          this.router.navigate(['/game', match.id]);
        })
      ),
    { dispatch: false }
  );

  joinMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GameActions.joinMatch),
      switchMap(({ inviteCode }) =>
        this.gameApi.joinMatch(inviteCode).pipe(
          map((match) => GameActions.joinMatchSuccess({ match })),
          catchError((error) =>
            of(GameActions.joinMatchFailure({ error: error?.error?.message || error.message }))
          )
        )
      )
    )
  );

  joinMatchSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.joinMatchSuccess),
        tap(({ match }) => {
          this.router.navigate(['/game', match.id]);
        })
      ),
    { dispatch: false }
  );

  // ─── Socket emit effects ──────────────────────────────────

  joinRoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.joinRoom),
        tap(({ matchId }) => this.socketService.emitJoinRoom(matchId))
      ),
    { dispatch: false }
  );

  leaveRoom$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.leaveRoom),
        tap(({ matchId }) => this.socketService.emitLeaveRoom(matchId))
      ),
    { dispatch: false }
  );

  startMatch$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.startMatch),
        tap(({ matchId }) => this.socketService.emitStartMatch(matchId))
      ),
    { dispatch: false }
  );

  submitAnswer$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.submitAnswer),
        tap(({ matchId, questionId, answer, timeMs }) =>
          this.socketService.emitSubmitAnswer(matchId, questionId, answer, timeMs)
        )
      ),
    { dispatch: false }
  );

  // ─── Socket listener effects ──────────────────────────────

  listenMatchStarted$ = createEffect(() =>
    this.socketService.matchStarted$.pipe(
      map((event) => GameActions.matchStarted({ event }))
    )
  );

  listenAnswerResult$ = createEffect(() =>
    this.socketService.answerResult$.pipe(
      map((result) => GameActions.answerResult({ result }))
    )
  );

  listenAnswerReceived$ = createEffect(() =>
    this.socketService.answerReceived$.pipe(
      map(() => GameActions.answerReceived())
    )
  );

  listenRoundResults$ = createEffect(() =>
    this.socketService.roundResults$.pipe(
      withLatestFrom(this.store.select(selectUserId)),
      map(([results, userId]) => GameActions.roundResults({ results, myUserId: userId! }))
    )
  );

  listenNextQuestion$ = createEffect(() =>
    this.socketService.nextQuestion$.pipe(
      map((event) => GameActions.nextQuestion({ event }))
    )
  );

  listenMatchFinished$ = createEffect(() =>
    this.socketService.matchFinished$.pipe(
      map((match) => GameActions.matchFinished({ match }))
    )
  );

  listenPlayerJoined$ = createEffect(() =>
    this.socketService.playerJoined$.pipe(
      map(({ userId, players }) => GameActions.playerJoined({ userId, players }))
    )
  );

  listenPlayerDisconnected$ = createEffect(() =>
    this.socketService.playerDisconnected$.pipe(
      map(({ userId }) => GameActions.playerDisconnected({ userId }))
    )
  );

  // ─── Toast notifications ──────────────────────────────────

  matchFinished$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.matchFinished),
        tap(() => {
          this.toastService.success('Match Complete', 'The game has ended!');
        })
      ),
    { dispatch: false }
  );

  onError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GameActions.createMatchFailure, GameActions.joinMatchFailure),
        tap(({ error }) => {
          this.toastService.error('Game Error', error);
        })
      ),
    { dispatch: false }
  );
}

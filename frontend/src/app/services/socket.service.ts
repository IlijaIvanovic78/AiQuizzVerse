import { Injectable } from '@angular/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import {
  FriendOnlineEvent,
  FriendOfflineEvent,
  FriendRequestSentEvent,
  FriendRequestAcceptedEvent,
  MatchStartedEvent,
  NextQuestionEvent,
  AnswerResult,
  RoundResults,
  Match,
  BoostResult,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private gameSocket: Socket | null = null;
  private destroy$ = new Subject<void>();
  private gameDestroy$ = new Subject<void>();

  // ─── Friend events ────────────────────────────────────────
  private friendOnlineSubject = new Subject<FriendOnlineEvent>();
  private friendOfflineSubject = new Subject<FriendOfflineEvent>();
  private friendRequestSentSubject = new Subject<FriendRequestSentEvent>();
  private friendRequestAcceptedSubject = new Subject<FriendRequestAcceptedEvent>();

  public friendOnline$ = this.friendOnlineSubject.asObservable();
  public friendOffline$ = this.friendOfflineSubject.asObservable();
  public friendRequestSent$ = this.friendRequestSentSubject.asObservable();
  public friendRequestAccepted$ = this.friendRequestAcceptedSubject.asObservable();

  // ─── Game events ──────────────────────────────────────────
  private playerJoinedSubject = new Subject<{ userId: string; players: any[] }>();
  private playerLeftSubject = new Subject<{ userId: string }>();
  private matchStartedSubject = new Subject<MatchStartedEvent>();
  private answerResultSubject = new Subject<AnswerResult>();
  private answerReceivedSubject = new Subject<{ questionId: string }>();
  private roundResultsSubject = new Subject<RoundResults>();
  private nextQuestionSubject = new Subject<NextQuestionEvent>();
  private matchFinishedSubject = new Subject<Match>();
  private playerDisconnectedSubject = new Subject<{ userId: string }>();
  private boostAppliedSubject = new Subject<BoostResult>();
  private boostErrorSubject = new Subject<{ message: string }>();

  public playerJoined$ = this.playerJoinedSubject.asObservable();
  public playerLeft$ = this.playerLeftSubject.asObservable();
  public matchStarted$ = this.matchStartedSubject.asObservable();
  public answerResult$ = this.answerResultSubject.asObservable();
  public answerReceived$ = this.answerReceivedSubject.asObservable();
  public roundResults$ = this.roundResultsSubject.asObservable();
  public nextQuestion$ = this.nextQuestionSubject.asObservable();
  public matchFinished$ = this.matchFinishedSubject.asObservable();
  public playerDisconnected$ = this.playerDisconnectedSubject.asObservable();
  public boostApplied$ = this.boostAppliedSubject.asObservable();
  public boostError$ = this.boostErrorSubject.asObservable();

  /**
   * Connect to main WebSocket server with JWT authentication
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('🔴 Socket connection error:', error.message);
    });

    // Pipe friend events into subjects
    fromEvent<FriendOnlineEvent>(this.socket, 'friend-online')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.friendOnlineSubject.next(event));

    fromEvent<FriendOfflineEvent>(this.socket, 'friend-offline')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.friendOfflineSubject.next(event));

    fromEvent<FriendRequestSentEvent>(this.socket, 'friend-request-sent')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.friendRequestSentSubject.next(event));

    fromEvent<FriendRequestAcceptedEvent>(this.socket, 'friend-request-accepted')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.friendRequestAcceptedSubject.next(event));
  }

  /**
   * Connect to game namespace for real-time gameplay
   */
  connectGame(token: string): void {
    if (this.gameSocket?.connected) {
      return;
    }

    this.gameSocket = io(`${environment.apiUrl}/game`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.gameSocket.on('connect', () => {
      console.log('✅ Game socket connected:', this.gameSocket?.id);
    });

    // Pipe game events into subjects
    fromEvent<{ userId: string; players: any[] }>(this.gameSocket, 'player-joined')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.playerJoinedSubject.next(e));

    fromEvent<{ userId: string }>(this.gameSocket, 'player-left')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.playerLeftSubject.next(e));

    fromEvent<MatchStartedEvent>(this.gameSocket, 'match-started')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.matchStartedSubject.next(e));

    fromEvent<AnswerResult>(this.gameSocket, 'answer-result')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.answerResultSubject.next(e));

    fromEvent<{ questionId: string }>(this.gameSocket, 'answer-received')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.answerReceivedSubject.next(e));

    fromEvent<RoundResults>(this.gameSocket, 'round-results')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.roundResultsSubject.next(e));

    fromEvent<NextQuestionEvent>(this.gameSocket, 'next-question')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.nextQuestionSubject.next(e));

    fromEvent<Match>(this.gameSocket, 'match-finished')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.matchFinishedSubject.next(e));

    fromEvent<{ userId: string }>(this.gameSocket, 'player-disconnected')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.playerDisconnectedSubject.next(e));

    fromEvent<BoostResult>(this.gameSocket, 'boost-applied')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.boostAppliedSubject.next(e));

    fromEvent<{ message: string }>(this.gameSocket, 'boost-error')
      .pipe(takeUntil(this.gameDestroy$))
      .subscribe((e) => this.boostErrorSubject.next(e));
  }

  // ─── Game emit helpers ────────────────────────────────────

  emitJoinRoom(matchId: string): void {
    this.gameSocket?.emit('join-room', { matchId });
  }

  emitLeaveRoom(matchId: string): void {
    this.gameSocket?.emit('leave-room', { matchId });
  }

  emitStartMatch(matchId: string): void {
    this.gameSocket?.emit('start-match', { matchId });
  }

  emitSubmitAnswer(matchId: string, questionId: string, answer: number, timeMs: number): void {
    this.gameSocket?.emit('submit-answer', { matchId, questionId, answer, timeMs });
  }

  emitUseBoost(matchId: string, boostType: string, questionId?: string): void {
    this.gameSocket?.emit('use-boost', { matchId, boostType, questionId });
  }

  /**
   * Disconnect from main WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.destroy$.next();
      this.destroy$.complete();
      this.destroy$ = new Subject<void>();
    }
  }

  /**
   * Disconnect from game namespace
   */
  disconnectGame(): void {
    if (this.gameSocket) {
      this.gameSocket.disconnect();
      this.gameSocket = null;
      this.gameDestroy$.next();
      this.gameDestroy$.complete();
      this.gameDestroy$ = new Subject<void>();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

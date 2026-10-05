import { Injectable, inject } from '@angular/core';
import { fromEvent } from 'rxjs';
import { TokenRefreshService } from '../auth/token-refresh.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { MatchResult, MatchView, SabotageType } from '../models/match.model';
import {
  BoostUsedEvent,
  LockedOutEvent,
  MatchDeadlineEvent,
  MatchErrorEvent,
  MatchOptionsEvent,
  MatchQuestionEvent,
  MatchStartingEvent,
  PlayerAnsweredEvent,
  PlayerLeftEvent,
  RoundResultEvent,
  SabotagedEvent,
  WaitingNextEvent,
} from '../models/realtime-events.model';
import { MatchBoostType } from '../models/shop.model';
import { createAuthorizedSocket } from './authorized-socket';
import { GAME_NAMESPACE } from './realtime.constants';

@Injectable({ providedIn: 'root' })
export class MatchSocketService {
  private readonly socket = createAuthorizedSocket(
    GAME_NAMESPACE,
    inject(TokenStorageService),
    inject(TokenRefreshService),
  );
  private currentMatchId: string | null = null;

  readonly lobby$ = fromEvent<MatchView>(this.socket, 'match:lobby');
  readonly starting$ = fromEvent<MatchStartingEvent>(this.socket, 'match:starting');
  readonly question$ = fromEvent<MatchQuestionEvent>(this.socket, 'match:question');
  readonly answered$ = fromEvent<PlayerAnsweredEvent>(this.socket, 'match:answered');
  readonly deadline$ = fromEvent<MatchDeadlineEvent>(this.socket, 'match:deadline');
  readonly roundResult$ = fromEvent<RoundResultEvent>(this.socket, 'match:round-result');
  readonly waitingNext$ = fromEvent<WaitingNextEvent>(this.socket, 'match:waiting-next');
  readonly boostUsed$ = fromEvent<BoostUsedEvent>(this.socket, 'match:boost-used');
  readonly lockedOut$ = fromEvent<LockedOutEvent>(this.socket, 'match:locked-out');
  readonly options$ = fromEvent<MatchOptionsEvent>(this.socket, 'match:options');
  readonly sabotaged$ = fromEvent<SabotagedEvent>(this.socket, 'match:sabotaged');
  readonly finished$ = fromEvent<MatchResult>(this.socket, 'match:finished');
  readonly playerLeft$ = fromEvent<PlayerLeftEvent>(this.socket, 'match:player-left');
  readonly error$ = fromEvent<MatchErrorEvent>(this.socket, 'match:error');

  constructor() {
    // A reconnect gets a new socket on the server, so it has to join the match room again.
    this.socket.on('connect', () => this.joinCurrentMatch());
  }

  enter(matchId: string): void {
    if (this.currentMatchId && this.currentMatchId !== matchId) {
      this.leave();
    }
    this.currentMatchId = matchId;
    if (this.socket.connected) {
      this.joinCurrentMatch();
    } else {
      this.socket.connect();
    }
  }

  leave(): void {
    if (!this.currentMatchId) {
      return;
    }
    this.socket.emit('match:leave', { matchId: this.currentMatchId });
    this.currentMatchId = null;
  }

  disconnect(): void {
    this.currentMatchId = null;
    this.socket.disconnect();
  }

  start(matchId: string): void {
    this.socket.emit('match:start', { matchId });
  }

  answer(matchId: string, questionIndex: number, optionIndex: number): void {
    this.socket.emit('match:answer', { matchId, questionIndex, optionIndex });
  }

  next(matchId: string, questionIndex: number): void {
    this.socket.emit('match:next', { matchId, questionIndex });
  }

  useBoost(matchId: string, type: MatchBoostType): void {
    this.socket.emit('match:boost', { matchId, type });
  }

  sabotage(matchId: string, targetUserId: string, type: SabotageType): void {
    this.socket.emit('match:sabotage', { matchId, targetUserId, type });
  }

  private joinCurrentMatch(): void {
    if (this.currentMatchId) {
      this.socket.emit('match:join', { matchId: this.currentMatchId });
    }
  }
}

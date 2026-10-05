import { Injectable, inject } from '@angular/core';
import { fromEvent } from 'rxjs';
import { TokenRefreshService } from '../auth/token-refresh.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { Friend, FriendRequest } from '../models/friend.model';
import {
  ChestEarnedEvent,
  CoinsUpdatedEvent,
  DuelInvite,
  FriendRemovedEvent,
  PresenceEvent,
  QuizProgress,
  RequestRemovedEvent,
} from '../models/realtime-events.model';
import { createAuthorizedSocket } from './authorized-socket';
import { DEFAULT_NAMESPACE } from './realtime.constants';

@Injectable({ providedIn: 'root' })
export class RealtimeSocketService {
  private readonly socket = createAuthorizedSocket(
    DEFAULT_NAMESPACE,
    inject(TokenStorageService),
    inject(TokenRefreshService),
  );

  readonly friendOnline$ = fromEvent<PresenceEvent>(this.socket, 'friend:online');
  readonly friendOffline$ = fromEvent<PresenceEvent>(this.socket, 'friend:offline');
  readonly friendRequest$ = fromEvent<FriendRequest>(this.socket, 'friend:request');
  readonly friendAccepted$ = fromEvent<Friend>(this.socket, 'friend:accepted');
  readonly requestRemoved$ = fromEvent<RequestRemovedEvent>(this.socket, 'friend:request-removed');
  readonly friendRemoved$ = fromEvent<FriendRemovedEvent>(this.socket, 'friend:removed');
  readonly duelInvite$ = fromEvent<DuelInvite>(this.socket, 'duel:invite');
  readonly quizProgress$ = fromEvent<QuizProgress>(this.socket, 'quiz:progress');
  readonly coinsUpdated$ = fromEvent<CoinsUpdatedEvent>(this.socket, 'coins:updated');
  readonly chestEarned$ = fromEvent<ChestEarnedEvent>(this.socket, 'chest:earned');

  connect(): void {
    this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}

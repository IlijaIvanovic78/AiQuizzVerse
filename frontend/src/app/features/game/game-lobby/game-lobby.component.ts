import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, take } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GameActions } from '../../../store/game/game.actions';
import {
  selectCurrentMatch,
  selectGameStatus,
  selectInviteCode,
  selectMatchPlayers,
  selectGameLoading,
  selectGameMode,
} from '../../../store/game/game.selectors';
import { selectAccessToken } from '../../../store/auth/auth.selectors';
import { SocketService } from '../../../services';
import { GamePlayComponent } from '../game-play/game-play.component';
import { GameResultComponent } from '../game-result/game-result.component';

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [CommonModule, GamePlayComponent, GameResultComponent],
  templateUrl: './game-lobby.component.html',
})
export class GameLobbyComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private socketService = inject(SocketService);
  private destroy$ = new Subject<void>();

  match$ = this.store.select(selectCurrentMatch);
  status$ = this.store.select(selectGameStatus);
  inviteCode$ = this.store.select(selectInviteCode);
  players$ = this.store.select(selectMatchPlayers);
  loading$ = this.store.select(selectGameLoading);
  mode$ = this.store.select(selectGameMode);

  copied = false;

  ngOnInit(): void {
    const matchId = this.route.snapshot.paramMap.get('id');
    if (!matchId) return;

    // Connect game socket
    this.store.select(selectAccessToken).pipe(take(1)).subscribe((token) => {
      if (token) {
        this.socketService.connectGame(token);
        // Join the room
        this.store.dispatch(GameActions.joinRoom({ matchId }));
      }
    });

    // If we don't have the match in store, load it
    this.match$.pipe(take(1)).subscribe((match) => {
      if (!match || match.id !== matchId) {
        // Match should already be in store from createMatch/joinMatch
        // If navigated directly, we would need a load action
      }
    });
  }

  startMatch(): void {
    this.match$.pipe(take(1)).subscribe((match) => {
      if (match) {
        this.store.dispatch(GameActions.startMatch({ matchId: match.id }));
      }
    });
  }

  copyInviteCode(code: string): void {
    navigator.clipboard.writeText(code);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }

  ngOnDestroy(): void {
    this.match$.pipe(take(1)).subscribe((match) => {
      if (match) {
        this.store.dispatch(GameActions.leaveRoom({ matchId: match.id }));
      }
    });
    this.socketService.disconnectGame();
    this.store.dispatch(GameActions.resetGame());
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { GameActions } from '../../../store/game/game.actions';
import {
  selectCurrentMatch,
  selectPlayerScore,
  selectOpponentScore,
  selectGameMode,
  selectMatchPlayers,
} from '../../../store/game/game.selectors';
import { selectUserId } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-game-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-result.component.html',
})
export class GameResultComponent {
  private store = inject(Store);
  private router = inject(Router);

  match$ = this.store.select(selectCurrentMatch);
  playerScore$ = this.store.select(selectPlayerScore);
  opponentScore$ = this.store.select(selectOpponentScore);
  mode$ = this.store.select(selectGameMode);
  players$ = this.store.select(selectMatchPlayers);
  userId$ = this.store.select(selectUserId);

  goToDashboard(): void {
    this.store.dispatch(GameActions.resetGame());
    this.router.navigate(['/dashboard']);
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { GameActions } from '../../../store/game/game.actions';
import { selectGameLoading, selectGameError } from '../../../store/game/game.selectors';

@Component({
  selector: 'app-join-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-game.component.html',
})
export class JoinGameComponent {
  private store = inject(Store);

  loading$ = this.store.select(selectGameLoading);
  error$ = this.store.select(selectGameError);

  inviteCode = '';

  joinMatch(): void {
    const code = this.inviteCode.trim();
    if (code.length === 6) {
      this.store.dispatch(GameActions.joinMatch({ inviteCode: code }));
    }
  }
}

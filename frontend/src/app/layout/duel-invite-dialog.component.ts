import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DuelInvite } from '../core/models/realtime-events.model';
import { HeroSpriteComponent } from '../shared/components/hero-sprite.component';
import { ModalComponent } from '../shared/components/modal.component';
import { MatchActions } from '../store/match/match.actions';
import { matchFeature } from '../store/match/match.reducer';

@Component({
  selector: 'app-duel-invite-dialog',
  imports: [HeroSpriteComponent, ModalComponent],
  templateUrl: './duel-invite-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelInviteDialogComponent {
  private readonly store = inject(Store);

  protected readonly invite = this.store.selectSignal(matchFeature.selectInvite);
  protected readonly title = computed(() =>
    this.invite()?.mode === 'TEAM' ? 'Team-up invite!' : 'Duel challenge!',
  );

  protected accept(invite: DuelInvite): void {
    this.store.dispatch(MatchActions.inviteAccepted({ invite }));
  }

  protected decline(): void {
    this.store.dispatch(MatchActions.inviteDismissed());
  }
}

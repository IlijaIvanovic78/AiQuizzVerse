import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatchMode } from '../core/models/match.model';
import { DuelInvite } from '../core/models/realtime-events.model';
import { HeroSpriteComponent } from '../shared/components/hero-sprite.component';
import { ModalComponent } from '../shared/components/modal.component';
import { MatchActions } from '../store/match/match.actions';
import { matchFeature } from '../store/match/match.reducer';

interface InviteWording {
  title: string;
  text: string;
  accept: string;
}

const INVITE_WORDING: Record<MatchMode, InviteWording> = {
  SOLO: { title: 'Invite!', text: 'invites you to play', accept: 'Accept' },
  DUEL: { title: 'Duel challenge!', text: 'challenges you to a duel on', accept: 'Accept' },
  TEAM: { title: 'Team-up invite!', text: 'wants to team up with you on', accept: 'Team up' },
  PARTY: {
    title: 'Party invite!',
    text: 'invites you to a quiz party on',
    accept: 'Join the party',
  },
};

@Component({
  selector: 'app-duel-invite-dialog',
  imports: [HeroSpriteComponent, ModalComponent],
  templateUrl: './duel-invite-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelInviteDialogComponent {
  private readonly store = inject(Store);

  protected readonly invite = this.store.selectSignal(matchFeature.selectInvite);
  protected readonly wording = computed(() => INVITE_WORDING[this.invite()?.mode ?? 'DUEL']);

  protected accept(invite: DuelInvite): void {
    this.store.dispatch(MatchActions.inviteAccepted({ invite }));
  }

  protected decline(): void {
    this.store.dispatch(MatchActions.inviteDismissed());
  }
}

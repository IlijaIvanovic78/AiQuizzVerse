import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatchMode } from '../core/models/match.model';
import { MatchInvite } from '../core/models/realtime-events.model';
import { HeroSpriteComponent } from '../shared/components/hero-sprite.component';
import { ModalComponent } from '../shared/components/modal.component';
import { matchInviteFeature } from '../store/match-invite/match-invite.reducer';
import { MatchActions } from '../store/match/match.actions';

interface InviteWording {
  title: string;
  text: string;
  accept: string;
}

const INVITE_WORDING: Record<MatchMode, InviteWording> = {
  SOLO: { title: 'Invite!', text: 'invites you to play', accept: 'Accept' },
  TEAM: { title: 'Team-up invite!', text: 'wants to team up with you on', accept: 'Team up' },
  PARTY: {
    title: 'Party invite!',
    text: 'invites you to a quiz party on',
    accept: 'Join the party',
  },
};

@Component({
  selector: 'app-match-invite-dialog',
  imports: [HeroSpriteComponent, ModalComponent],
  templateUrl: './match-invite-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchInviteDialogComponent {
  private readonly store = inject(Store);

  protected readonly invite = this.store.selectSignal(matchInviteFeature.selectInvite);
  protected readonly wordings = INVITE_WORDING;

  protected accept(invite: MatchInvite): void {
    this.store.dispatch(MatchActions.inviteAccepted({ invite }));
  }

  protected decline(): void {
    this.store.dispatch(MatchActions.inviteDismissed());
  }
}

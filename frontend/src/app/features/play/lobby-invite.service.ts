import { DOCUMENT, Injectable, computed, inject, linkedSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import { ToastService } from '../../core/notifications/toast.service';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';

// What the host uses in the lobby to bring friends in: the invite code, the share link and
// invites to friends who are online. Provided by the match page, like MatchClockService.
@Injectable()
export class LobbyInviteService {
  private readonly store = inject(Store);
  private readonly toast = inject(ToastService);
  private readonly origin = inject(DOCUMENT).location.origin;

  private readonly matchId = this.store.selectSignal(matchFeature.selectMatchId);
  private readonly match = this.store.selectSignal(matchFeature.selectMatch);
  private readonly inviteCode = computed(() => this.match()?.inviteCode ?? '');
  // The friends invited to this lobby. A rematch opens its new lobby on the same page, so the
  // list starts empty again for every new match.
  private readonly invited = linkedSignal({
    source: this.matchId,
    computation: (): string[] => [],
  });

  readonly canShare = 'share' in navigator;
  readonly shareUrl = computed(() => `${this.origin}/join/${this.inviteCode()}`);
  readonly invitedIds = this.invited.asReadonly();

  invite(friendId: string): void {
    const matchId = this.matchId();
    if (matchId) {
      this.invited.update((ids) => [...ids, friendId]);
      this.store.dispatch(MatchActions.inviteFriend({ matchId, friendId }));
    }
  }

  copyCode(): void {
    this.copyText(this.inviteCode(), 'Code copied!');
  }

  copyLink(): void {
    this.copyText(this.shareUrl(), 'Link copied!');
  }

  share(): void {
    const shared = navigator.share({
      title: 'AI QuizVerse',
      text: `Join my match with the code ${this.inviteCode()}`,
      url: this.shareUrl(),
    });
    // Closing the share sheet rejects the promise, which is not an error for the player.
    shared.catch(() => undefined);
  }

  private copyText(text: string, doneMessage: string): void {
    // The clipboard API exists only on https or localhost, not on a LAN address.
    if (!navigator.clipboard) {
      this.toast.error("Copying isn't available here. Select the text and copy it yourself.");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => this.toast.success(doneMessage),
      () => this.toast.error("Copying didn't work. Select the text and copy it yourself."),
    );
  }
}

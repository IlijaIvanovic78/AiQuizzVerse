import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Friend } from '../../../core/models/friend.model';
import { MatchView } from '../../../core/models/match.model';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';

const PLAYERS_NEEDED = 2;

@Component({
  selector: 'app-match-lobby',
  imports: [RouterLink, HeroSpriteComponent, LevelBadgeComponent, SpinnerComponent],
  templateUrl: './match-lobby.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchLobbyComponent {
  readonly match = input.required<MatchView>();
  readonly meId = input.required<string>();
  readonly shareUrl = input.required<string>();
  readonly canShare = input(false);
  readonly friends = input<Friend[]>([]);
  readonly invitedIds = input<string[]>([]);
  readonly copyCode = output<void>();
  readonly copyLink = output<void>();
  readonly share = output<void>();
  readonly invite = output<string>();
  readonly start = output<void>();

  protected readonly playersNeeded = PLAYERS_NEEDED;
  protected readonly letters = computed(() => (this.match().inviteCode ?? '').split(''));
  protected readonly spokenCode = computed(() => this.letters().join(' '));
  protected readonly isHost = computed(() => this.match().hostId === this.meId());
  private readonly host = computed(() =>
    this.match().players.find((player) => player.user.id === this.match().hostId),
  );
  private readonly guest = computed(() =>
    this.match().players.find((player) => player.user.id !== this.match().hostId),
  );
  // Both players have the match page open, so the host can start.
  protected readonly ready = computed(
    () =>
      this.match().players.length === PLAYERS_NEEDED &&
      this.match().players.every((player) => player.isConnected),
  );
  protected readonly startLabel = computed(() =>
    this.match().mode === 'DUEL' ? 'Start the duel' : 'Start team match',
  );
  protected readonly status = computed(() => {
    const hostName = this.host()?.user.username ?? 'The host';
    const guestName = this.guest()?.user.username;
    if (!this.isHost()) {
      return { title: "You're in!", text: `${hostName} will start the match soon.` };
    }
    if (!guestName) {
      return {
        title: 'Waiting for a friend',
        text: 'Share the code, or invite a friend who is online right now.',
      };
    }
    if (!this.ready()) {
      return { title: `${guestName} joined`, text: 'Waiting for them to open the match...' };
    }
    return { title: `${guestName} is here!`, text: 'Press start when you are both ready.' };
  });
}

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Friend } from '../../../core/models/friend.model';
import { MatchMode, MatchView } from '../../../core/models/match.model';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { MAX_PLAYERS, PLAYERS_TO_START } from '../../../shared/play-modes';
import { FriendInviteStatus } from '../../../store/match/match.reducer';

interface LobbyStatus {
  title: string;
  text: string;
}

const START_LABELS: Record<MatchMode, string> = {
  SOLO: 'Start',
  TEAM: 'Start team match',
  PARTY: 'Start the party',
};

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
  // Keyed by friend id; a friend who is missing can be invited.
  readonly invites = input<Record<string, FriendInviteStatus>>({});
  readonly copyCode = output<void>();
  readonly copyLink = output<void>();
  readonly share = output<void>();
  readonly invite = output<string>();
  readonly start = output<void>();

  protected readonly letters = computed(() => (this.match().inviteCode ?? '').split(''));
  protected readonly spokenCode = computed(() => this.letters().join(' '));
  protected readonly isHost = computed(() => this.match().hostId === this.meId());
  protected readonly maxPlayers = computed(() => MAX_PLAYERS[this.match().mode]);
  // Every seat of the mode: the players who joined, then empty seats.
  protected readonly seats = computed(() =>
    Array.from({ length: this.maxPlayers() }, (_, seat) => this.match().players[seat] ?? null),
  );
  protected readonly isFull = computed(() => this.match().players.length >= this.maxPlayers());
  // Players who have the match page open; the host can start once there are enough of them.
  private readonly hereCount = computed(
    () => this.match().players.filter((player) => player.isConnected).length,
  );
  protected readonly ready = computed(
    () => this.hereCount() >= PLAYERS_TO_START[this.match().mode],
  );
  protected readonly startLabel = computed(() => START_LABELS[this.match().mode]);
  // Friends who already joined need no invite.
  protected readonly invitableFriends = computed(() => {
    const playerIds = this.match().players.map((player) => player.user.id);
    return this.friends().filter((friend) => !playerIds.includes(friend.user.id));
  });
  protected readonly status = computed<LobbyStatus>(() => {
    if (!this.isHost()) {
      const host = this.match().players.find((player) => player.user.id === this.match().hostId);
      const hostName = host?.user.username ?? 'The host';
      return { title: "You're in!", text: `${hostName} will start the match soon.` };
    }
    return this.match().mode === 'PARTY' ? this.partyStatus() : this.teamStatus();
  });

  private teamStatus(): LobbyStatus {
    const guestName = this.match().players.find((player) => player.user.id !== this.meId())?.user
      .username;
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
  }

  private partyStatus(): LobbyStatus {
    if (this.match().players.length === 1) {
      return {
        title: 'Waiting for friends',
        text: `Share the code, or invite friends who are online. ${PLAYERS_TO_START.PARTY} to ${this.maxPlayers()} players can play.`,
      };
    }
    if (!this.ready()) {
      return { title: 'Friends are joining', text: 'Waiting for them to open the match...' };
    }
    if (this.isFull()) {
      return { title: 'The party is full!', text: 'Press start when everyone is ready.' };
    }
    return {
      title: `${this.hereCount()} players are here!`,
      text: `Start now, or wait for more friends (up to ${this.maxPlayers()}).`,
    };
  }
}

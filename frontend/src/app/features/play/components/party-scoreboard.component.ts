import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { AttackType, SabotageType } from '../../../core/models/match.model';
import { PixelIconComponent, PixelIconName } from '../../../shared/components/pixel-icon.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar.component';
import { ArenaFighter } from '../arena-fighter';
import { SABOTAGES } from '../play.constants';
import { ChargeMeterComponent } from './charge-meter.component';
import { SabotageIconComponent } from './sabotage-icon.component';

interface SeatStatus {
  text: string;
  badgeClass: string;
  // Sabotage badges get their color from SABOTAGES instead of a class.
  badgeColor: string | null;
  pixelIcon: PixelIconName | null;
  sabotageIcon: SabotageType | null;
}

// One seat per party player: score, sabotage charges and what happened to them this round.
// While the player picks a sabotage target, the seats of the others turn into buttons.
@Component({
  selector: 'app-party-scoreboard',
  imports: [
    NgTemplateOutlet,
    ChargeMeterComponent,
    PixelIconComponent,
    SabotageIconComponent,
    UserAvatarComponent,
  ],
  templateUrl: './party-scoreboard.component.html',
  styleUrl: './party-scoreboard.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyScoreboardComponent {
  // The player comes first, then the others in the order they joined.
  readonly fighters = input.required<ArenaFighter[]>();
  readonly winnerId = input<string | null>(null);
  // Set while the player picks who to hit with this sabotage.
  readonly targetType = input<AttackType | null>(null);
  readonly targetIds = input<string[]>([]);
  readonly target = output<string>();

  protected readonly seats = computed(() =>
    this.fighters().map((fighter) => ({
      fighter,
      status: this.statusOf(fighter),
      pickable: this.targetType() !== null && !fighter.isMe,
      canBeHit: this.targetIds().includes(fighter.id),
    })),
  );
  protected readonly command = computed(() => {
    const type = this.targetType();
    return type ? SABOTAGES[type].label : '';
  });
  private readonly targetButtons = viewChildren<ElementRef<HTMLButtonElement>>('targetButton');

  constructor() {
    // Picking a sabotage removes the button that had the focus, so the focus moves on to the
    // first player who can be hit. On a phone this also scrolls the scoreboard into view.
    afterRenderEffect(() => {
      const firstTarget = this.targetButtons().find((button) => !button.nativeElement.disabled);
      firstTarget?.nativeElement.focus();
    });
  }

  private statusOf(fighter: ArenaFighter): SeatStatus | null {
    if (fighter.away) {
      return seatStatus('Left', 'badge-fog');
    }
    if (fighter.id === this.winnerId()) {
      return seatStatus('Got it first!', 'badge-torch', 'trophy');
    }
    if (fighter.blocked) {
      return { ...seatStatus('Blocked!', 'badge-shield animate-pop'), sabotageIcon: 'SHIELD' };
    }
    if (fighter.lockedOut) {
      return seatStatus('Locked out', 'badge-ruby', 'cross');
    }
    if (fighter.hitBy) {
      const { status, badgeColor } = SABOTAGES[fighter.hitBy];
      return { ...seatStatus(status, 'text-night-950'), badgeColor, sabotageIcon: fighter.hitBy };
    }
    if (fighter.shielded) {
      return { ...seatStatus('Shielded', 'badge-shield'), sabotageIcon: 'SHIELD' };
    }
    return fighter.answered ? seatStatus('Answered', 'badge-jade', 'check') : null;
  }
}

function seatStatus(
  text: string,
  badgeClass: string,
  pixelIcon: PixelIconName | null = null,
): SeatStatus {
  return { text, badgeClass, badgeColor: null, pixelIcon, sabotageIcon: null };
}

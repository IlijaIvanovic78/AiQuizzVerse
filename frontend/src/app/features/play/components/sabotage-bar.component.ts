import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SabotageType } from '../../../core/models/match.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { FREEZE_SECONDS, PARTY_MAX_CHARGES, SABOTAGE_LABELS } from '../play.constants';
import { SabotageIconComponent } from './sabotage-icon.component';

interface SabotageChoice {
  type: SabotageType;
  label: string;
  description: string;
}

const CHOICES: SabotageChoice[] = [
  { type: 'INK', label: SABOTAGE_LABELS.INK, description: 'Splash ink on their question' },
  {
    type: 'FREEZE',
    label: SABOTAGE_LABELS.FREEZE,
    description: `No answering for ${FREEZE_SECONDS} seconds`,
  },
  { type: 'SCRAMBLE', label: SABOTAGE_LABELS.SCRAMBLE, description: 'Mix up their answers' },
];

const PROMPT_VERBS: Record<SabotageType, string> = {
  INK: 'splash with ink',
  FREEZE: 'freeze',
  SCRAMBLE: 'scramble',
};

// Party only: spend a charge to slow down another player. Picking a sabotage here lights up
// the players who can be hit on the scoreboard.
@Component({
  selector: 'app-sabotage-bar',
  imports: [PixelIconComponent, SabotageIconComponent],
  templateUrl: './sabotage-bar.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SabotageBarComponent {
  readonly charges = input.required<number>();
  readonly chosen = input<SabotageType | null>(null);
  readonly canSabotage = input(false);
  readonly usedThisRound = input(false);
  readonly hasTargets = input(false);
  readonly choose = output<SabotageType>();
  readonly cancel = output<void>();

  protected readonly choices = CHOICES;
  protected readonly chargeSlots = Array.from({ length: PARTY_MAX_CHARGES }, (_, slot) => slot);
  protected readonly prompt = computed(() => {
    const type = this.chosen();
    return type ? `Who do you want to ${PROMPT_VERBS[type]}?` : '';
  });
  protected readonly hint = computed(() => {
    if (this.charges() === 0) {
      return 'No charges left. Win a round to earn one!';
    }
    if (this.usedThisRound()) {
      return 'One sabotage per question. Wait for the next one!';
    }
    if (!this.hasTargets()) {
      return 'Nobody can be hit right now.';
    }
    return 'Pick one, then tap the player you want to hit.';
  });
}

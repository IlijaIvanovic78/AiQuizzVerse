import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SabotageType } from '../../../core/models/match.model';
import { SABOTAGES } from '../play.constants';
import { ChargeMeterComponent } from './charge-meter.component';
import { SabotageIconComponent } from './sabotage-icon.component';

const CHOICES: SabotageType[] = ['INK', 'FREEZE', 'SCRAMBLE'];

// Party only: spend a charge to slow down another player. Picking a sabotage here lights up
// the players who can be hit on the scoreboard.
@Component({
  selector: 'app-sabotage-bar',
  imports: [ChargeMeterComponent, SabotageIconComponent],
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
  protected readonly sabotages = SABOTAGES;
  protected readonly prompt = computed(() => {
    const type = this.chosen();
    return type ? `Who do you want to ${SABOTAGES[type].promptVerb}?` : '';
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

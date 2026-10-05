import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AttackType } from '../../../core/models/match.model';
import { SABOTAGES } from '../play.constants';
import { ChargeMeterComponent } from './charge-meter.component';
import { SabotageIconComponent } from './sabotage-icon.component';

const ATTACKS: AttackType[] = ['INK', 'FREEZE', 'SCRAMBLE', 'FOG', 'QUAKE', 'MIRROR'];

// Party only: spend a charge to slow down another player, or to raise a shield for yourself.
// Picking an attack here lights up the players who can be hit on the scoreboard.
@Component({
  selector: 'app-sabotage-bar',
  imports: [ChargeMeterComponent, SabotageIconComponent],
  templateUrl: './sabotage-bar.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SabotageBarComponent {
  readonly charges = input.required<number>();
  readonly chosen = input<AttackType | null>(null);
  readonly canSabotage = input(false);
  readonly canShield = input(false);
  readonly shielded = input(false);
  readonly usedThisRound = input(false);
  readonly hasTargets = input(false);
  readonly choose = output<AttackType>();
  readonly cancel = output<void>();
  readonly shield = output<void>();

  protected readonly attacks = ATTACKS;
  protected readonly sabotages = SABOTAGES;
  protected readonly prompt = computed(() => {
    const type = this.chosen();
    return type ? `Who do you want to ${SABOTAGES[type].promptVerb}?` : '';
  });
  protected readonly hint = computed(() => {
    if (this.shielded()) {
      return 'Your shield is up. The next sabotage aimed at you bounces off.';
    }
    if (this.charges() === 0) {
      return 'No charges left. Win a round to earn one!';
    }
    if (this.usedThisRound()) {
      return 'One sabotage per question. Wait for the next one!';
    }
    if (!this.hasTargets()) {
      return 'Nobody can be hit right now.';
    }
    return 'Pick one, then tap the player you want to hit. Or raise a shield.';
  });
}

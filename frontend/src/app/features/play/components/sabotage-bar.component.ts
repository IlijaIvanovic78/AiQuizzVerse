import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AttackType, SabotageType } from '../../../core/models/match.model';
import { SabotageIconComponent } from '../../../shared/components/sabotage-icon.component';
import { missesSabotages, ownedAttacks } from '../party-round.rules';
import { SABOTAGES } from '../play.constants';
import { ChargeMeterComponent } from './charge-meter.component';

// Party only: spend a charge to slow down another player, or to raise a shield for yourself.
// Picking an attack here lights up the players who can be hit on the scoreboard.
// Only the sabotages the player owns are shown; the others are bought in the shop.
@Component({
  selector: 'app-sabotage-bar',
  imports: [ChargeMeterComponent, SabotageIconComponent],
  templateUrl: './sabotage-bar.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SabotageBarComponent {
  readonly charges = input.required<number>();
  readonly owned = input.required<SabotageType[]>();
  readonly chosen = input<AttackType | null>(null);
  readonly canSabotage = input(false);
  readonly canShield = input(false);
  readonly shielded = input(false);
  readonly usedThisRound = input(false);
  readonly hasTargets = input(false);
  readonly choose = output<AttackType>();
  readonly cancel = output<void>();
  readonly shield = output<void>();

  protected readonly attacks = computed(() => ownedAttacks(this.owned()));
  protected readonly hasShield = computed(() => this.owned().includes('SHIELD'));
  protected readonly moreInShop = computed(() => missesSabotages(this.owned()));
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
    const pickTarget = 'Pick one, then tap the player you want to hit.';
    return this.hasShield() ? `${pickTarget} Or raise a shield.` : pickTarget;
  });
}

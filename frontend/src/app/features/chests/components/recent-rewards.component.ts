import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChestView } from '../../../core/models/chest.model';
import { CHEST_ICONS, CHEST_NAMES } from '../../../shared/chests';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { SabotageIconComponent } from '../../../shared/components/sabotage-icon.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { sabotageOfItem } from '../../../shared/sabotages';
import { rewardSummary } from '../chest-reward';

@Component({
  selector: 'app-recent-rewards',
  imports: [PixelIconComponent, SabotageIconComponent, RelativeTimePipe],
  templateUrl: './recent-rewards.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentRewardsComponent {
  readonly chests = input.required<ChestView[]>();

  protected readonly chestIcons = CHEST_ICONS;
  protected readonly chestNames = CHEST_NAMES;
  protected readonly rows = computed(() =>
    this.chests().map((chest) => {
      const item = chest.reward?.item ?? null;
      return {
        chest,
        summary: chest.reward ? rewardSummary(chest.reward) : '',
        sabotage: item ? sabotageOfItem(item) : null,
      };
    }),
  );
}

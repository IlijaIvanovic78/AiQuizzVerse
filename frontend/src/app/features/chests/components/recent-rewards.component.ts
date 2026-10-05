import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChestView } from '../../../core/models/chest.model';
import { CHEST_ICONS, CHEST_NAMES } from '../../../shared/chests';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { rewardSummary } from '../chest-reward';

@Component({
  selector: 'app-recent-rewards',
  imports: [PixelIconComponent, RelativeTimePipe],
  templateUrl: './recent-rewards.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentRewardsComponent {
  readonly chests = input.required<ChestView[]>();

  protected readonly chestIcons = CHEST_ICONS;
  protected readonly chestNames = CHEST_NAMES;
  protected readonly rows = computed(() =>
    this.chests().map((chest) => ({
      chest,
      summary: chest.reward ? rewardSummary(chest.reward) : '',
    })),
  );
}

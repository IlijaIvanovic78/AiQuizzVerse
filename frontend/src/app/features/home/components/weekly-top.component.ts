import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardEntry } from '../../../core/models/leaderboard.model';
import { RankBadgeComponent } from '../../../shared/components/rank-badge.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar.component';
import { SectionStatus } from '../home.types';

@Component({
  selector: 'app-weekly-top',
  imports: [DecimalPipe, RouterLink, RankBadgeComponent, SpinnerComponent, UserAvatarComponent],
  templateUrl: './weekly-top.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyTopComponent {
  readonly entries = input.required<LeaderboardEntry[]>();
  readonly myUserId = input.required<string>();
  readonly status = input.required<SectionStatus>();
}

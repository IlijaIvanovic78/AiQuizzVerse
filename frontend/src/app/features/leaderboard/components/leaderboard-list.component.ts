import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardEntry } from '../../../core/models/leaderboard.model';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { RankBadgeComponent } from '../../../shared/components/rank-badge.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar.component';

@Component({
  selector: 'app-leaderboard-list',
  imports: [DecimalPipe, RouterLink, LevelBadgeComponent, RankBadgeComponent, UserAvatarComponent],
  templateUrl: './leaderboard-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardListComponent {
  readonly entries = input.required<LeaderboardEntry[]>();
  readonly myUserId = input.required<string>();
}

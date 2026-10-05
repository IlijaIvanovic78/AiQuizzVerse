import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-leaderboard-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Leaderboard" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardPageComponent {}

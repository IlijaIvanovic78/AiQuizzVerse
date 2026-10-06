import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProfileView } from '../../../core/models/profile.model';
import { CurrentUser } from '../../../core/models/user.model';
import { ArenaStageComponent } from '../../../shared/components/arena-stage.component';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { LevelProgressComponent } from '../../../shared/components/level-progress.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { StreakFlameComponent } from '../../../shared/components/streak-flame.component';

type LevelProgress = Pick<CurrentUser, 'xpIntoLevel' | 'xpForNextLevel'>;

@Component({
  selector: 'app-profile-hero-card',
  imports: [
    DatePipe,
    DecimalPipe,
    ArenaStageComponent,
    LevelBadgeComponent,
    LevelProgressComponent,
    PixelIconComponent,
    StreakFlameComponent,
  ],
  templateUrl: './profile-hero-card.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeroCardComponent {
  readonly profile = input.required<ProfileView>();
  // Only the player's own profile knows how far the next level is.
  readonly levelProgress = input<LevelProgress | null>(null);

  protected readonly user = computed(() => this.profile().user);
  protected readonly winsLabel = computed(() =>
    this.profile().stats.wins === 1 ? '1 win' : `${this.profile().stats.wins} wins`,
  );
  protected readonly streakLabel = computed(() => {
    const streak = this.user().streak;
    if (streak === 0) {
      return 'No streak right now';
    }
    return streak === 1 ? '1 day in a row' : `${streak} days in a row`;
  });
}

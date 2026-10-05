import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CurrentUser } from '../../../core/models/user.model';
import { SpriteManifestService } from '../../../core/sprites/sprite-manifest.service';
import { ArenaStageComponent } from '../../../shared/components/arena-stage.component';
import { CoinAmountComponent } from '../../../shared/components/coin-amount.component';
import { LevelBadgeComponent } from '../../../shared/components/level-badge.component';
import { LevelProgressComponent } from '../../../shared/components/level-progress.component';
import { StreakFlameComponent } from '../../../shared/components/streak-flame.component';

@Component({
  selector: 'app-hero-banner',
  imports: [
    ArenaStageComponent,
    CoinAmountComponent,
    LevelBadgeComponent,
    LevelProgressComponent,
    StreakFlameComponent,
  ],
  templateUrl: './hero-banner.component.html',
  styleUrl: './hero-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroBannerComponent {
  private readonly sprites = inject(SpriteManifestService);

  readonly user = input.required<CurrentUser>();

  protected readonly heroName = computed(
    () => this.sprites.getSprite(this.user().avatarKey)?.name ?? 'Hero',
  );
  protected readonly streakDays = computed(() => (this.user().streak === 1 ? 'day' : 'days'));
  protected readonly streakTip = computed(() => {
    const { streak, streakFreezes } = this.user();
    if (streak === 0) {
      return 'Finish a quiz today to light your streak flame!';
    }
    if (streakFreezes === 0) {
      return 'Play every day to keep the flame burning.';
    }
    const freezes = streakFreezes === 1 ? '1 streak freeze' : `${streakFreezes} streak freezes`;
    return `${freezes} will save it if you miss a day.`;
  });
}

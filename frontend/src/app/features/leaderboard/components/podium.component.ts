import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardEntry } from '../../../core/models/leaderboard.model';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';

const PODIUM_PLACES = [1, 2, 3];
const WINNER_SCALE = 5;
const RUNNER_UP_SCALE = 4;
const HERO_ENTER_DELAY_MS = 120;
// The top 16 of the 32 sprite rows are empty, so the hero is pulled up under its name.
const EMPTY_FRAME_TOP = 16;

@Component({
  selector: 'app-podium',
  imports: [DecimalPipe, RouterLink, HeroSpriteComponent, PixelIconComponent],
  templateUrl: './podium.component.html',
  styleUrl: './podium.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodiumComponent {
  // The first three entries of the board.
  readonly entries = input.required<LeaderboardEntry[]>();
  readonly myUserId = input.required<string>();

  protected readonly places = computed(() =>
    PODIUM_PLACES.map((place) => {
      const heroScale = place === 1 ? WINNER_SCALE : RUNNER_UP_SCALE;
      return {
        place,
        entry: this.entries().at(place - 1) ?? null,
        heroScale,
        heroOffset: -EMPTY_FRAME_TOP * heroScale,
        enterDelayMs: place * HERO_ENTER_DELAY_MS,
      };
    }),
  );
}

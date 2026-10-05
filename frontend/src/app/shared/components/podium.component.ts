import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicUser } from '../../core/models/user.model';
import { HeroSpriteComponent } from './hero-sprite.component';
import { PixelIconComponent } from './pixel-icon.component';

// One spot on the podium: the weekly leaderboard counts XP, a party counts points.
export interface PodiumPlace {
  rank: number;
  user: PublicUser;
  value: number;
}

const PODIUM_PLACES = [1, 2, 3];
export const PODIUM_SIZE = PODIUM_PLACES.length;
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
  // The best three, in order.
  readonly places = input.required<PodiumPlace[]>();
  readonly myUserId = input.required<string>();
  readonly unit = input.required<string>();
  readonly label = input('Top three');

  protected readonly spots = computed(() =>
    PODIUM_PLACES.map((place) => {
      const heroScale = place === 1 ? WINNER_SCALE : RUNNER_UP_SCALE;
      return {
        place,
        entry: this.places().at(place - 1) ?? null,
        heroScale,
        heroOffset: -EMPTY_FRAME_TOP * heroScale,
        enterDelayMs: place * HERO_ENTER_DELAY_MS,
      };
    }),
  );
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PetSpriteComponent } from '../../../shared/components/pet-sprite.component';
import { DESKTOP_UP, TABLET_UP, screenMatches } from '../../../shared/media-query';
import { ArenaFighter } from '../arena-fighter.rules';
import { COINS_LAND_MS } from '../play.constants';
import { ArenaFighterComponent } from './arena-fighter.component';

type ArenaSide = 'left' | 'right';

const HERO_SCALES = { phone: 3, tablet: 4, desktop: 5 };
const FLYING_COIN_DELAYS_MS = [0, 90, 180, 270];
const BURST_COINS = [
  { x: '-40px', y: '-44px', delayMs: COINS_LAND_MS },
  { x: '-14px', y: '-70px', delayMs: COINS_LAND_MS + 50 },
  { x: '16px', y: '-62px', delayMs: COINS_LAND_MS + 25 },
  { x: '42px', y: '-40px', delayMs: COINS_LAND_MS + 80 },
];

@Component({
  selector: 'app-battle-arena',
  imports: [ArenaFighterComponent, PetSpriteComponent],
  templateUrl: './battle-arena.component.html',
  styleUrl: './battle-arena.component.css',
  host: { '[class.arena-banner]': 'banner()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleArenaComponent {
  readonly leftFighters = input.required<ArenaFighter[]>();
  // The other half of a party faces the player from the right platform.
  readonly rightFighters = input<ArenaFighter[]>([]);
  readonly showChest = input(false);
  // Turning this on sends coins from the heroes into the chest once.
  readonly coinsFlying = input(false);
  // A dashed spot for the player who has not joined yet.
  readonly emptySide = input<ArenaSide | null>(null);
  // A wide, low arena for pages where it sits above other content, like the lobby and results.
  readonly banner = input(false);
  // Two heroes on each platform, like a party of three or four: the heroes keep their size,
  // but their status bubbles show only an icon so they don't cover each other.
  readonly crowded = input(false);

  private readonly tabletUp = screenMatches(TABLET_UP);
  private readonly desktopUp = screenMatches(DESKTOP_UP);

  // Sprites scale by whole pixels only, so the arena picks a scale per screen size.
  protected readonly heroScale = computed(() => {
    if (this.desktopUp()) {
      return HERO_SCALES.desktop;
    }
    return this.tabletUp() ? HERO_SCALES.tablet : HERO_SCALES.phone;
  });
  protected readonly petScale = computed(() => this.heroScale() - 1);
  protected readonly flyingCoinDelays = FLYING_COIN_DELAYS_MS;
  protected readonly burstCoins = BURST_COINS;
  protected readonly coinsLandMs = COINS_LAND_MS;

  protected readonly description = computed(() => {
    const team = namesOf(this.leftFighters()) || 'The arena';
    const rivals = namesOf(this.rightFighters());
    if (rivals) {
      return `${team} against ${rivals}`;
    }
    return this.showChest() ? `${team} next to the treasure chest` : team;
  });
}

function namesOf(fighters: ArenaFighter[]): string {
  return fighters.map((fighter) => (fighter.isMe ? 'You' : fighter.name)).join(' and ');
}

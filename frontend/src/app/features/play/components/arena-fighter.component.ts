import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { ArenaFighter } from '../arena-fighter';
import { SabotageIconComponent } from './sabotage-icon.component';

@Component({
  selector: 'app-arena-fighter',
  imports: [HeroSpriteComponent, PixelIconComponent, SabotageIconComponent],
  templateUrl: './arena-fighter.component.html',
  styleUrl: './arena-fighter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaFighterComponent {
  readonly fighter = input.required<ArenaFighter>();
  readonly scale = input.required<number>();
  // Flipped heroes face left, like a duel rival on the right platform.
  readonly flip = input(false);
  // Status bubbles show only their icon when two heroes share a platform.
  readonly compact = input(false);
}

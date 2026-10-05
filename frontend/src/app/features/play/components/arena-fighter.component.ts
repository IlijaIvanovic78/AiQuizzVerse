import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HeroSpriteComponent } from '../../../shared/components/hero-sprite.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { ArenaFighter } from '../arena-fighter';

@Component({
  selector: 'app-arena-fighter',
  imports: [HeroSpriteComponent, PixelIconComponent],
  template: `
    @if (fighter().points !== null) {
      <span class="points-anchor" aria-hidden="true">
        <span class="points animate-float-up font-display">+{{ fighter().points }}</span>
      </span>
    } @else if (fighter().away) {
      <span class="bubble">Away</span>
    } @else if (fighter().answered && !fighter().isMe) {
      <span class="bubble bubble-done">
        <app-pixel-icon name="check" [scale]="1" />
        Answered
      </span>
    }
    <app-hero-sprite
      [class.away]="fighter().away"
      [heroKey]="fighter().heroKey"
      [scale]="scale()"
      [action]="fighter().action"
      [flip]="flip()"
      [decorative]="true"
    />
  `,
  styleUrl: './arena-fighter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaFighterComponent {
  readonly fighter = input.required<ArenaFighter>();
  readonly scale = input.required<number>();
  // Flipped heroes face left, like a duel rival on the right platform.
  readonly flip = input(false);
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SabotageIconComponent } from './sabotage-icon.component';

// FREEZE sabotage: ice over the answer buttons with a countdown. The buttons themselves are
// disabled by the answer grid, because the server rejects answers until the ice melts.
@Component({
  selector: 'app-frost-frame',
  imports: [SabotageIconComponent],
  template: `
    @if (secondsLeft() > 0) {
      <div class="frost" role="status" animate.enter="frost-enter" animate.leave="frost-leave">
        @for (corner of corners; track corner) {
          <app-sabotage-icon class="corner" [class]="corner" type="FREEZE" [scale]="2" />
        }
        <p class="frost-badge">
          <app-sabotage-icon type="FREEZE" [scale]="2" />
          <span>Frozen!</span>
          <span class="font-display" aria-hidden="true">{{ secondsLeft() }}</span>
          <span class="sr-only">You can answer again in a moment.</span>
        </p>
      </div>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: -0.375rem;
      z-index: 1;
      pointer-events: none;
    }

    .frost {
      position: relative;
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      border: 4px solid #bfe8ff;
      border-radius: 4px;
      background-color: rgba(159, 220, 255, 0.3);
      box-shadow:
        0 0 0 3px var(--outline),
        inset 0 0 0 3px var(--mana-600);
    }

    .corner {
      position: absolute;
    }

    .top-left {
      top: 4px;
      left: 4px;
    }

    .top-right {
      top: 4px;
      right: 4px;
    }

    .bottom-left {
      bottom: 4px;
      left: 4px;
    }

    .bottom-right {
      right: 4px;
      bottom: 4px;
    }

    .frost-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      border: 3px solid var(--outline);
      border-radius: 4px;
      background-color: var(--night-900);
      color: #bfe8ff;
      font-size: 1.25rem;
      font-weight: 600;
      box-shadow: 0 4px 0 var(--outline);
    }

    .frost-enter {
      animation: freeze-in 220ms ease-out;
    }

    .frost-leave {
      animation: melt 400ms ease-in forwards;
    }

    @keyframes freeze-in {
      from {
        transform: scale(1.06);
        opacity: 0;
      }
    }

    @keyframes melt {
      to {
        transform: translateY(6px);
        opacity: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrostFrameComponent {
  readonly secondsLeft = input.required<number>();

  protected readonly corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { COUNTDOWN_STEP_MS } from '../play.constants';

@Component({
  selector: 'app-countdown-overlay',
  template: `
    <div class="grid h-full w-full place-items-center bg-night-950/45" role="status">
      <span
        class="step rounded border-3 border-outline bg-night-900 px-5 py-3 font-display text-3xl text-torch-300 shadow-[0_4px_0_theme(colors.outline)] md:text-5xl"
        [style.animation-duration.ms]="stepMs"
      >
        {{ label() }}
      </span>
    </div>
  `,
  styles: `
    /* The pop repeats once per step, in time with the labels, so every number pops in. */
    .step {
      animation: step-pop ease-out infinite;
    }

    @keyframes step-pop {
      0% {
        transform: scale(0.3);
        opacity: 0;
      }
      35% {
        transform: scale(1.2);
        opacity: 1;
      }
      55%,
      100% {
        transform: scale(1);
      }
    }
  `,
  host: { class: 'block h-full w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownOverlayComponent {
  readonly label = input.required<string>();

  protected readonly stepMs = COUNTDOWN_STEP_MS;
}

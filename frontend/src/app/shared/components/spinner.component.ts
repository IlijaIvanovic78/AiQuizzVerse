import { ChangeDetectionStrategy, Component, input } from '@angular/core';

const BLINK_DELAY_MS = 300;

@Component({
  selector: 'app-spinner',
  template: `
    <span class="inline-flex items-center gap-3" role="status">
      <span class="flex gap-1.5" aria-hidden="true">
        @for (block of blocks; track block) {
          <span
            class="animate-blink block h-3 w-3 border-2 border-outline bg-torch-400"
            [style.animation-delay.ms]="block * blinkDelay"
          ></span>
        }
      </span>
      <span>{{ label() }}</span>
    </span>
  `,
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {
  readonly label = input.required<string>();

  protected readonly blocks = [0, 1, 2];
  protected readonly blinkDelay = BLINK_DELAY_MS;
}

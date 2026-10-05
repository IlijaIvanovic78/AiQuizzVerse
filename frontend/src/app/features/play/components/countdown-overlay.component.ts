import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-countdown-overlay',
  template: `
    <div class="grid h-full w-full place-items-center bg-night-950/45" role="status">
      <!-- Tracking by the label re-creates the text, so every step pops in again. -->
      @for (step of steps(); track step) {
        <span
          class="animate-pop rounded border-3 border-outline bg-night-900 px-5 py-3 font-display text-3xl text-torch-300 shadow-[0_4px_0_theme(colors.outline)] md:text-5xl"
        >
          {{ step }}
        </span>
      }
    </div>
  `,
  host: { class: 'block h-full w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownOverlayComponent {
  readonly label = input.required<string>();

  protected readonly steps = computed(() => [this.label()]);
}

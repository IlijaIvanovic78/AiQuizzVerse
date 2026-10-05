import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BannerTone = 'torch' | 'night';

const TONE_CLASSES: Record<BannerTone, string> = {
  torch: 'bg-torch-400 text-night-950',
  night: 'bg-night-900 text-parchment-100',
};

// A short line over the ground of the arena, under the heroes, like "demo_friend got it first!".
@Component({
  selector: 'app-arena-banner',
  template: `
    <p
      class="animate-banner-in rounded border-3 border-outline px-2 py-0.5 text-center text-xs font-semibold leading-tight shadow-[0_3px_0_theme(colors.outline)] md:px-3 md:py-1 md:text-base"
      [class]="toneClass()"
      role="status"
    >
      {{ text() }}
    </p>
  `,
  host: { class: 'block max-w-full self-end px-2 pb-1.5 md:pb-3' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaBannerComponent {
  readonly text = input.required<string>();
  readonly tone = input<BannerTone>('night');

  protected readonly toneClass = computed(() => TONE_CLASSES[this.tone()]);
}

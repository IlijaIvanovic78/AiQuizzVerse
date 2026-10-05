import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BarTone = 'torch' | 'jade' | 'ruby' | 'mana' | 'gold';
export type BarSize = 'sm' | 'md' | 'lg';

const FILL_CLASSES: Record<BarTone, string> = {
  torch: 'bg-torch-400',
  jade: 'bg-jade-400',
  ruby: 'bg-ruby-400',
  mana: 'bg-mana-400',
  gold: 'bg-gold',
};

const HEIGHT_CLASSES: Record<BarSize, string> = {
  sm: 'h-3',
  md: 'h-5',
  lg: 'h-7',
};

@Component({
  selector: 'app-progress-bar',
  template: `
    <div
      class="overflow-hidden rounded border-3 border-outline bg-night-950"
      [class]="heightClass()"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="percent()"
      [attr.aria-label]="label()"
    >
      <div
        class="h-full shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] transition-[width] duration-500 ease-out"
        [class]="fillClass()"
        [style.width.%]="percent()"
      ></div>
    </div>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  // A fraction from 0 to 1.
  readonly value = input.required<number>();
  readonly label = input.required<string>();
  readonly tone = input<BarTone>('torch');
  readonly size = input<BarSize>('md');

  protected readonly percent = computed(() => Math.round(clamp(this.value()) * 100));
  protected readonly fillClass = computed(() => FILL_CLASSES[this.tone()]);
  protected readonly heightClass = computed(() => HEIGHT_CLASSES[this.size()]);
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

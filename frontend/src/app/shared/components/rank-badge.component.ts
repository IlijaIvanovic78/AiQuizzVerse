import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Gold, silver and bronze for the top three; everyone else gets a plain stone badge.
const MEDAL_CLASSES = [
  'bg-gold text-night-950',
  'bg-fog-200 text-night-950',
  'bg-torch-600 text-parchment-100',
];
const PLAIN_CLASS = 'bg-night-700 text-parchment-100';

@Component({
  selector: 'app-rank-badge',
  template: `
    <span
      class="flex h-9 min-w-9 items-center justify-center rounded border-3 border-outline px-1 font-display text-xs shadow-[inset_0_-3px_0_rgba(0,0,0,0.3)]"
      [class]="colorClass()"
    >
      <span class="sr-only">Rank</span>
      {{ rank() }}
    </span>
  `,
  host: { class: 'inline-flex shrink-0' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankBadgeComponent {
  readonly rank = input.required<number>();

  protected readonly colorClass = computed(() => MEDAL_CLASSES[this.rank() - 1] ?? PLAIN_CLASS);
}

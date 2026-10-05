import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-level-badge',
  template: `
    <span
      class="inline-flex items-baseline gap-1 rounded border-3 border-outline bg-torch-400 px-2 py-0.5 text-night-950 shadow-[inset_0_-3px_0_theme(colors.torch.600)]"
    >
      <span class="sr-only">Level</span>
      <span class="text-sm font-semibold" aria-hidden="true">Lv</span>
      <span class="font-display text-sm">{{ level() }}</span>
    </span>
  `,
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelBadgeComponent {
  readonly level = input.required<number>();
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProgressBarComponent } from './progress-bar.component';

@Component({
  selector: 'app-level-progress',
  imports: [ProgressBarComponent],
  template: `
    <p class="mb-1.5 text-sm font-semibold">{{ xpToGo() }} XP to level {{ level() + 1 }}</p>
    <app-progress-bar [value]="fraction()" label="Experience to next level" tone="mana" />
    <p class="mt-1 text-right text-sm text-muted">
      {{ xpIntoLevel() }} / {{ xpForNextLevel() }} XP
    </p>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelProgressComponent {
  readonly level = input.required<number>();
  readonly xpIntoLevel = input.required<number>();
  readonly xpForNextLevel = input.required<number>();

  protected readonly xpToGo = computed(() => this.xpForNextLevel() - this.xpIntoLevel());
  protected readonly fraction = computed(() =>
    this.xpForNextLevel() > 0 ? this.xpIntoLevel() / this.xpForNextLevel() : 0,
  );
}

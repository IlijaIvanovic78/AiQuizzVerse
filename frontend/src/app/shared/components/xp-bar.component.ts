import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProgressBarComponent } from './progress-bar.component';

@Component({
  selector: 'app-xp-bar',
  imports: [ProgressBarComponent],
  template: `
    <app-progress-bar [value]="fraction()" label="Experience to next level" tone="mana" />
    <p class="mt-1 text-right text-sm text-muted">{{ current() }} / {{ total() }} XP</p>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpBarComponent {
  readonly current = input.required<number>();
  readonly total = input.required<number>();

  protected readonly fraction = computed(() =>
    this.total() > 0 ? this.current() / this.total() : 0,
  );
}

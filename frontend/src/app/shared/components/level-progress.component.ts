import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { XpBarComponent } from './xp-bar.component';

@Component({
  selector: 'app-level-progress',
  imports: [XpBarComponent],
  template: `
    <p class="mb-1.5 text-sm font-semibold">{{ xpToGo() }} XP to level {{ level() + 1 }}</p>
    <app-xp-bar [current]="xpIntoLevel()" [total]="xpForNextLevel()" />
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelProgressComponent {
  readonly level = input.required<number>();
  readonly xpIntoLevel = input.required<number>();
  readonly xpForNextLevel = input.required<number>();

  protected readonly xpToGo = computed(() => this.xpForNextLevel() - this.xpIntoLevel());
}

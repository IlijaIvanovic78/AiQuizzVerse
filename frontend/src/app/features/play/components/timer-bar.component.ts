import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BarTone, ProgressBarComponent } from '../../../shared/components/progress-bar.component';
import { MS_PER_SECOND, TIMER_WARNING_SECONDS } from '../play.constants';

@Component({
  selector: 'app-timer-bar',
  imports: [ProgressBarComponent],
  templateUrl: './timer-bar.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerBarComponent {
  readonly remainingMs = input.required<number>();
  readonly limitSeconds = input.required<number>();
  // After answering the bar stops and shows how much time was left.
  readonly locked = input(false);

  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / MS_PER_SECOND));
  protected readonly fraction = computed(
    () => this.remainingMs() / (this.limitSeconds() * MS_PER_SECOND),
  );
  protected readonly warning = computed(
    () => !this.locked() && this.seconds() <= TIMER_WARNING_SECONDS,
  );
  protected readonly tone = computed<BarTone>(() => {
    if (this.locked()) {
      return 'jade';
    }
    return this.warning() ? 'ruby' : 'mana';
  });
  protected readonly status = computed(() => {
    if (this.locked()) {
      return 'Locked in!';
    }
    return this.seconds() === 0 ? "Time's up!" : 'Time left';
  });
  // Keyed by the second, so the number pops once every second while time runs out.
  protected readonly secondKeys = computed(() => [this.seconds()]);
}

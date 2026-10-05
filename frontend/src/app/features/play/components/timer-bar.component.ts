import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BarTone, ProgressBarComponent } from '../../../shared/components/progress-bar.component';
import { MS_PER_SECOND, TIMER_WARNING_SECONDS } from '../play.constants';

@Component({
  selector: 'app-timer-bar',
  imports: [ProgressBarComponent],
  templateUrl: './timer-bar.component.html',
  styleUrl: './timer-bar.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerBarComponent {
  readonly remainingMs = input.required<number>();
  readonly limitSeconds = input.required<number>();
  // After answering the bar stops and shows how much time was left.
  readonly locked = input(false);
  // Party: a wrong answer locks the player out, while the others keep racing the clock.
  readonly lockedOut = input(false);

  protected readonly seconds = computed(() => Math.ceil(this.remainingMs() / MS_PER_SECOND));
  protected readonly fraction = computed(
    () => this.remainingMs() / (this.limitSeconds() * MS_PER_SECOND),
  );
  protected readonly warning = computed(
    () => !this.locked() && this.seconds() <= TIMER_WARNING_SECONDS,
  );
  protected readonly tone = computed<BarTone>(() => {
    if (this.locked() && !this.lockedOut()) {
      return 'jade';
    }
    return this.warning() ? 'ruby' : 'mana';
  });
  protected readonly status = computed(() => {
    if (this.lockedOut()) {
      return 'Locked out';
    }
    if (this.locked()) {
      return 'Locked in!';
    }
    return this.seconds() === 0 ? "Time's up!" : 'Time left';
  });
}

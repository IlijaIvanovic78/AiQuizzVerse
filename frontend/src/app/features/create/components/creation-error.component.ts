import { HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CreationError } from '../../../store/quizzes/quizzes.reducer';
import { creationErrorTitle } from '../create.rules';

@Component({
  selector: 'app-creation-error',
  templateUrl: './creation-error.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationErrorComponent {
  readonly error = input.required<CreationError>();
  readonly retry = output<void>();
  readonly back = output<void>();

  protected readonly isConflict = computed(() => this.error().status === HttpStatusCode.Conflict);
  protected readonly title = computed(() => creationErrorTitle(this.error().status));
  // After the daily limit only tomorrow helps, so there is no point in trying again now.
  protected readonly canRetry = computed(
    () => this.error().status !== HttpStatusCode.TooManyRequests,
  );
}

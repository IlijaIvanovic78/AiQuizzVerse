import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PARTY_WRONG_PENALTY } from '../play.constants';

// Shown before the first question: how long the quiz is and how to answer.
@Component({
  selector: 'app-get-ready',
  template: `
    <section class="panel-parchment p-5 text-center">
      <h2 class="text-2xl">Get ready!</h2>
      <p class="read-text mt-2">
        {{ questionCount() }} questions, {{ secondsEach() }} seconds each.
      </p>
      @if (party()) {
        <p class="read-text mt-2">
          The first right answer wins the round. A wrong answer locks you out and costs
          {{ wrongPenalty }} points. Win rounds to earn sabotage charges!
        </p>
      }
      <p class="mt-3 text-muted">
        Tip: press 1, 2, 3 or 4 to answer, and Enter for the next question.
      </p>
    </section>
  `,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetReadyComponent {
  readonly questionCount = input.required<number>();
  readonly secondsEach = input.required<number>();
  readonly party = input(false);

  protected readonly wrongPenalty = PARTY_WRONG_PENALTY;
}

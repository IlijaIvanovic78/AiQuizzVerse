import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { PixelIconComponent, PixelIconName } from '../../../shared/components/pixel-icon.component';
import { SpinnerComponent } from '../../../shared/components/spinner.component';

export type RoundOutcome = 'correct' | 'wrong' | 'missed' | 'beaten';

export interface TeammateResult {
  name: string;
  answered: boolean;
  correct: boolean;
  points: number;
}

interface OutcomeLook {
  title: string;
  icon: PixelIconName;
  tileClass: string;
  textClass: string;
}

const OUTCOME_LOOKS: Record<RoundOutcome, OutcomeLook> = {
  correct: {
    title: 'Correct!',
    icon: 'check',
    tileClass: 'bg-jade-400',
    textClass: 'text-jade-400',
  },
  wrong: {
    title: 'Not quite',
    icon: 'cross',
    tileClass: 'bg-ruby-400',
    textClass: 'text-ruby-400',
  },
  missed: {
    title: "Time's up!",
    icon: 'cross',
    tileClass: 'bg-torch-400',
    textClass: 'text-torch-300',
  },
  beaten: {
    title: 'Too slow!',
    icon: 'cross',
    tileClass: 'bg-torch-400',
    textClass: 'text-torch-300',
  },
};

@Component({
  selector: 'app-reveal-panel',
  imports: [PixelIconComponent, SpinnerComponent],
  templateUrl: './reveal-panel.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevealPanelComponent {
  readonly outcome = input.required<RoundOutcome>();
  readonly points = input(0);
  // Unknown after a page refresh during the reveal, because the server does not resend the question.
  readonly correctAnswer = input<string | null>(null);
  readonly explanation = input.required<string>();
  readonly others = input<TeammateResult[]>([]);
  // Party rounds are a race: a wrong answer locks the player out and costs points.
  readonly party = input(false);
  readonly pressed = input(false);
  readonly waitingFor = input<string[]>([]);
  readonly lastRound = input(false);
  readonly canReadAloud = input(false);
  readonly speaking = input(false);
  readonly next = output<void>();
  readonly readAloud = output<void>();

  private readonly nextButton = viewChild.required<ElementRef<HTMLButtonElement>>('nextButton');

  protected readonly look = computed(() => OUTCOME_LOOKS[this.outcome()]);
  protected readonly subtitle = computed(() => {
    if (this.outcome() === 'correct') {
      return `+${this.points()} points`;
    }
    const penalty = this.points() < 0 ? `${this.points()} points. ` : '';
    const answer = this.correctAnswer();
    const reason = answer
      ? `The right answer is: ${answer}`
      : 'Read why below, then try the next one.';
    return penalty + reason;
  });
  protected readonly otherLines = computed(() =>
    this.others().map((other) => ({ ...other, text: this.describe(other) })),
  );
  protected readonly waitingText = computed(() => {
    const names = this.waitingFor();
    return names.length > 0
      ? `Waiting for ${names.join(' and ')}...`
      : 'Here comes the next one...';
  });

  constructor() {
    // Enter and Space press the focused Next button, and on phones it scrolls into view.
    afterNextRender(() => this.nextButton().nativeElement.focus());
  }

  private describe(other: TeammateResult): string {
    if (other.correct) {
      return `${this.party() ? 'got it first' : 'got it right'} (+${other.points})`;
    }
    if (!this.party()) {
      return 'missed this one';
    }
    if (!other.answered) {
      return 'was too slow';
    }
    return other.points < 0 ? `was locked out (${other.points})` : 'was locked out';
  }
}

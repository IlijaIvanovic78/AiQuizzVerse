import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PixelIconComponent, PixelIconName } from '../../../shared/components/pixel-icon.component';
import { ANSWER_KEYS, SHORT_OPTION_LENGTH } from '../play.constants';
import { OtherPick } from '../round-view';

type AnswerState =
  | 'open'
  | 'picked'
  | 'locked-out'
  | 'correct'
  | 'wrong'
  | 'dimmed'
  | 'removed'
  | 'tried';

interface AnswerNote {
  text: string;
  icon: PixelIconName;
}

const NOTES: Record<AnswerState, AnswerNote | null> = {
  open: null,
  dimmed: null,
  picked: { text: 'Locked in', icon: 'lock' },
  'locked-out': { text: 'Locked out', icon: 'cross' },
  correct: { text: 'Right answer', icon: 'check' },
  wrong: { text: 'Your answer', icon: 'cross' },
  removed: { text: 'Removed', icon: 'cross' },
  tried: { text: 'Not this one', icon: 'cross' },
};

@Component({
  selector: 'app-answer-grid',
  imports: [PixelIconComponent],
  templateUrl: './answer-grid.component.html',
  styleUrl: './answer-grid.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnswerGridComponent {
  readonly options = input.required<string[]>();
  readonly myPick = input<number | null>(null);
  // Known only after the round, when the right answer is shown.
  readonly correctIndex = input<number | null>(null);
  readonly removed = input<number[]>([]);
  // My wrong first pick, crossed out while a second chance lets me try again.
  readonly wrongTry = input<number | null>(null);
  readonly otherPicks = input<OtherPick[]>([]);
  // Party: my pick was wrong, so I sit out the rest of this question.
  readonly lockedOut = input(false);
  // No answer can be picked for now: a party freeze, or the player came back in the middle
  // of the question and waits for the next one.
  readonly paused = input(false);
  // Party sabotages: QUAKE shakes the buttons around, MIRROR flips the answer texts.
  readonly quaking = input(false);
  readonly mirrored = input(false);
  readonly picked = output<number>();

  // Short answers fit two in a row, which keeps all four on a phone screen.
  protected readonly shortOptions = computed(() =>
    this.options().every((option) => option.length <= SHORT_OPTION_LENGTH),
  );
  protected readonly answers = computed(() =>
    this.options().map((text, index) => {
      const state = this.stateOf(index);
      return {
        key: ANSWER_KEYS[index],
        text,
        state,
        note: this.noteFor(state, index),
        pickedBy: this.otherPicks()
          .filter((pick) => pick.optionIndex === index)
          .map((pick) => pick.name),
        disabled: state !== 'open' || this.paused(),
      };
    }),
  );

  private stateOf(index: number): AnswerState {
    const correctIndex = this.correctIndex();
    const myPick = this.myPick();
    if (correctIndex !== null) {
      if (index === correctIndex) {
        return 'correct';
      }
      return index === myPick ? 'wrong' : 'dimmed';
    }
    if (this.removed().includes(index)) {
      return 'removed';
    }
    if (index === this.wrongTry()) {
      return 'tried';
    }
    if (myPick === null) {
      return 'open';
    }
    if (index !== myPick) {
      return 'dimmed';
    }
    return this.lockedOut() ? 'locked-out' : 'picked';
  }

  private noteFor(state: AnswerState, index: number): AnswerNote | null {
    if (state === 'correct' && index === this.myPick()) {
      return { text: 'You got it!', icon: 'check' };
    }
    return NOTES[state];
  }
}

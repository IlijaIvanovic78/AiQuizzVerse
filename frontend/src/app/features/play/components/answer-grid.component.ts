import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PixelIconComponent, PixelIconName } from '../../../shared/components/pixel-icon.component';
import { ANSWER_KEYS, SHORT_OPTION_LENGTH } from '../play.constants';

export interface OtherPick {
  name: string;
  optionIndex: number | null;
}

type AnswerState = 'open' | 'picked' | 'correct' | 'wrong' | 'dimmed' | 'removed';

interface AnswerNote {
  text: string;
  icon: PixelIconName;
}

const NOTES: Record<AnswerState, AnswerNote | null> = {
  open: null,
  dimmed: null,
  picked: { text: 'Locked in', icon: 'lock' },
  correct: { text: 'Right answer', icon: 'check' },
  wrong: { text: 'Your answer', icon: 'cross' },
  removed: { text: 'Removed', icon: 'cross' },
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
  readonly otherPicks = input<OtherPick[]>([]);
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
        disabled: state !== 'open',
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
    if (myPick === null) {
      return 'open';
    }
    return index === myPick ? 'picked' : 'dimmed';
  }

  private noteFor(state: AnswerState, index: number): AnswerNote | null {
    if (state === 'correct' && index === this.myPick()) {
      return { text: 'You got it!', icon: 'check' };
    }
    return NOTES[state];
  }
}

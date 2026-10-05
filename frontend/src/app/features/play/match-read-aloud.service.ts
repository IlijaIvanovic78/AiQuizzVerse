import { DestroyRef, Injectable, effect, inject, untracked } from '@angular/core';
import { Store } from '@ngrx/store';
import { ReadAloudService } from '../../core/sound/read-aloud.service';
import { matchFeature } from '../../store/match/match.reducer';

// Reads the open question with its answers, or the explanation after a round. Reading stops
// when the next question comes and when the page closes. Provided by the match page.
@Injectable()
export class MatchReadAloudService {
  private readonly store = inject(Store);
  private readonly speech = inject(ReadAloudService);

  private readonly match = this.store.selectSignal(matchFeature.selectMatch);
  private readonly question = this.store.selectSignal(matchFeature.selectQuestion);
  private readonly round = this.store.selectSignal(matchFeature.selectRound);

  readonly isSupported = this.speech.isSupported;
  readonly speaking = this.speech.speaking;

  constructor() {
    effect(() => {
      this.question();
      untracked(() => this.speech.stop());
    });
    inject(DestroyRef).onDestroy(() => this.speech.stop());
  }

  readQuestion(): void {
    const question = this.question();
    if (question) {
      const options = question.options.map((option, index) => `${index + 1}: ${option}.`);
      this.toggle(`${question.text} ${options.join(' ')}`);
    }
  }

  readExplanation(): void {
    const round = this.round();
    if (round) {
      this.toggle(round.explanation);
    }
  }

  // The same button starts and stops the reading.
  private toggle(text: string): void {
    if (this.speaking()) {
      this.speech.stop();
      return;
    }
    this.speech.speak(text, this.match()?.quiz.language ?? 'EN');
  }
}

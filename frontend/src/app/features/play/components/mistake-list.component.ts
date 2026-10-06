import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { from, interval, map, scan, switchMap, zip } from 'rxjs';
import { MatchResultQuestion } from '../../../core/models/match.model';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import { REVIEW_ROW_DELAY_MS } from '../play.constants';

@Component({
  selector: 'app-mistake-list',
  imports: [PixelIconComponent],
  templateUrl: './mistake-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MistakeListComponent {
  readonly questions = input.required<MatchResultQuestion[]>();
  // An empty list is a perfect run only when every answer was right. In a party a player can
  // also lose every round without a single wrong answer.
  readonly perfect = input(false);
  // The notebook note is news only right after the match, not when it is opened again later.
  readonly justFinished = input(false);

  // zip pairs every missed question with a tick, so the rows appear one after another.
  protected readonly shownRows = toSignal(
    toObservable(this.questions).pipe(
      switchMap((questions) =>
        zip(from(questions), interval(REVIEW_ROW_DELAY_MS)).pipe(
          map(([question]) => question),
          scan((rows: MatchResultQuestion[], question) => [...rows, question], []),
        ),
      ),
    ),
    { initialValue: [] },
  );
}

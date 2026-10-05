import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchHistoryEntry, MatchOutcome } from '../../../core/models/match.model';
import { SpinnerComponent } from '../../../shared/components/spinner.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { ThemeLabelPipe } from '../../../shared/pipes/theme-label.pipe';
import { MODE_LABELS } from '../../../shared/play-modes';
import { RECENT_MATCHES_SHOWN } from '../profile.constants';

// A lost party is still a good fight; the app never says "Defeat".
const OUTCOME_LOOKS: Record<MatchOutcome, { label: string; badge: string }> = {
  WIN: { label: 'Victory', badge: 'badge-jade' },
  LOSS: { label: 'Good fight', badge: 'badge-fog' },
  DRAW: { label: 'Draw', badge: 'badge-mana' },
  DONE: { label: 'Finished', badge: 'badge-torch' },
};

@Component({
  selector: 'app-match-history-list',
  imports: [RouterLink, SpinnerComponent, RelativeTimePipe, ThemeLabelPipe],
  templateUrl: './match-history-list.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchHistoryListComponent {
  readonly entries = input.required<MatchHistoryEntry[]>();
  readonly loaded = input.required<boolean>();

  protected readonly rows = computed(() =>
    this.entries()
      .slice(0, RECENT_MATCHES_SHOWN)
      .map((entry) => ({
        entry,
        mode: MODE_LABELS[entry.mode],
        correct: `${entry.correctCount}/${entry.questionCount}`,
        partnerWord: entry.mode === 'TEAM' ? 'with' : 'vs',
        ...OUTCOME_LOOKS[entry.result],
      })),
  );
}

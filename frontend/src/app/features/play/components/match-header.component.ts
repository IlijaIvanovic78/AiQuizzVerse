import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatchMode } from '../../../core/models/match.model';
import { QuizKind, QuizTheme } from '../../../core/models/quiz.model';
import { ThemeBadgeComponent } from '../../../shared/components/theme-badge.component';
import { MODE_LABELS } from '../../../shared/play-modes';

// Path steps and mistake reviews are always played solo, so their kind says more than the mode.
const KIND_LABELS: Record<QuizKind, string | null> = {
  STANDARD: null,
  PATH_STEP: 'Path step',
  REVIEW: 'Mistakes review',
};

@Component({
  selector: 'app-match-header',
  imports: [ThemeBadgeComponent],
  templateUrl: './match-header.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchHeaderComponent {
  readonly title = input.required<string>();
  readonly theme = input<QuizTheme | null>(null);
  readonly mode = input.required<MatchMode>();
  readonly kind = input<QuizKind | null>(null);
  readonly progressLabel = input('');
  readonly muted = input(false);
  // Null hides the button, for example on the results screen.
  readonly quitLabel = input<string | null>(null);
  readonly toggleSound = output<void>();
  readonly quit = output<void>();

  protected readonly modeLabel = computed(() => {
    const kind = this.kind();
    const kindLabel = kind ? KIND_LABELS[kind] : null;
    return kindLabel ?? MODE_LABELS[this.mode()];
  });
}

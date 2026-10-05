import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { QuizTheme } from '../../../core/models/quiz.model';
import { ThemeBadgeComponent } from '../../../shared/components/theme-badge.component';

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
  readonly modeLabel = input.required<string>();
  readonly progressLabel = input('');
  readonly muted = input(false);
  // Null hides the button, for example on the results screen.
  readonly quitLabel = input<string | null>(null);
  readonly toggleSound = output<void>();
  readonly quit = output<void>();
}

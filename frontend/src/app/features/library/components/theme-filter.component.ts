import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { QuizTheme } from '../../../core/models/quiz.model';
import { ThemeLabelPipe } from '../../../shared/pipes/theme-label.pipe';
import { ThemeCount } from '../quiz-filters';

@Component({
  selector: 'app-theme-filter',
  imports: [ThemeLabelPipe],
  templateUrl: './theme-filter.component.html',
  styleUrl: './theme-filter.component.css',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeFilterComponent {
  readonly counts = input.required<ThemeCount[]>();
  readonly total = input.required<number>();
  readonly selected = model.required<QuizTheme | null>();
}

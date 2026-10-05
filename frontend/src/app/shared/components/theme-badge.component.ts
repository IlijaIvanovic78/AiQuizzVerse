import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { QuizTheme } from '../../core/models/quiz.model';
import { ThemeLabelPipe } from '../pipes/theme-label.pipe';

@Component({
  selector: 'app-theme-badge',
  imports: [ThemeLabelPipe],
  template: `<span class="badge badge-mana">{{ theme() | themeLabel }}</span>`,
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeBadgeComponent {
  readonly theme = input.required<QuizTheme>();
}

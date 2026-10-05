import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-quiz-detail-page',
  imports: [PageHeaderComponent],
  template: '<app-page-header title="Quiz" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizDetailPageComponent {
  readonly quizId = input.required<string>();
}

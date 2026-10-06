import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { QuizSource } from '../../../core/models/quiz.model';
import { ChoiceCardComponent } from '../../../shared/components/choice-card.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import {
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  TOPIC_MAX_LENGTH,
  TOPIC_MIN_LENGTH,
} from '../../../shared/forms/quiz-form';
import { itemIconUrl } from '../../../shared/icons';
import { SOURCE_CHOICES, TOPIC_SUGGESTIONS } from '../create.constants';
import { UploadState } from '../create.types';
import { PdfDropzoneComponent } from './pdf-dropzone.component';

// Wizard step 1: a typed topic, an uploaded lesson or questions written by hand.
@Component({
  selector: 'app-source-step',
  imports: [ReactiveFormsModule, ChoiceCardComponent, PdfDropzoneComponent, PixelIconComponent],
  templateUrl: './source-step.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceStepComponent {
  readonly source = model.required<QuizSource>();
  readonly topic = input.required<FormControl<string>>();
  readonly topicValue = input.required<string>();
  readonly topicInvalid = input.required<boolean>();
  readonly upload = input.required<UploadState>();
  readonly topicSubmitted = output<void>();
  readonly fileChosen = output<File>();
  readonly lessonRemoved = output<void>();

  protected readonly choices = SOURCE_CHOICES;
  protected readonly suggestions = TOPIC_SUGGESTIONS;
  protected readonly itemIconUrl = itemIconUrl;
  protected readonly limits = {
    minTopic: TOPIC_MIN_LENGTH,
    maxTopic: TOPIC_MAX_LENGTH,
    minQuestions: MIN_QUESTIONS,
    maxQuestions: MAX_QUESTIONS,
  };

  protected suggestTopic(topic: string): void {
    this.topic().setValue(topic);
    this.topic().markAsTouched();
  }
}

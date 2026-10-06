import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Audience,
  Difficulty,
  QuizLanguage,
  QuizSource,
  QuizTheme,
} from '../../../core/models/quiz.model';
import { NumberStepperComponent } from '../../../shared/components/number-stepper.component';
import { PixelIconComponent } from '../../../shared/components/pixel-icon.component';
import {
  MAX_QUESTIONS,
  MAX_TIME_PER_QUESTION,
  MIN_QUESTIONS,
  MIN_TIME_PER_QUESTION,
  QUIZ_TITLE_MAX_LENGTH,
  QUIZ_TITLE_MIN_LENGTH,
  TIME_STEP_SECONDS,
} from '../../../shared/forms/quiz-form';
import { LanguageLabelPipe } from '../../../shared/pipes/language-label.pipe';
import { ThemeLabelPipe } from '../../../shared/pipes/theme-label.pipe';
import { PATH_STEP_COUNT } from '../../paths/paths.constants';
import { DIFFICULTY_CHOICES, LANGUAGES, QUIZ_THEMES } from '../create.constants';
import { CreateKind } from '../create.types';
import { AudiencePickerComponent } from './audience-picker.component';

// Wizard settings: who it is for, the language and, for a quiz, difficulty, length and time.
// A quiz written by hand also gets its name and theme here.
@Component({
  selector: 'app-settings-step',
  imports: [
    ReactiveFormsModule,
    LanguageLabelPipe,
    ThemeLabelPipe,
    AudiencePickerComponent,
    NumberStepperComponent,
    PixelIconComponent,
  ],
  templateUrl: './settings-step.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsStepComponent {
  readonly source = input.required<QuizSource>();
  readonly kind = input.required<CreateKind>();
  readonly subject = input.required<string>();
  readonly quizTitle = input.required<FormControl<string>>();
  readonly quizTitleInvalid = input.required<boolean>();
  // Picking who it is for also sets a fair time, so the page changes the audience itself.
  readonly audience = input.required<Audience>();
  readonly audiencePicked = output<Audience>();
  readonly language = model.required<QuizLanguage>();
  readonly difficulty = model.required<Difficulty>();
  readonly theme = model.required<QuizTheme>();
  readonly questionCount = model.required<number>();
  readonly timePerQuestion = model.required<number>();

  protected readonly languages = LANGUAGES;
  protected readonly difficulties = DIFFICULTY_CHOICES;
  protected readonly themes = QUIZ_THEMES;
  protected readonly pathSteps = PATH_STEP_COUNT;
  protected readonly limits = {
    minTitle: QUIZ_TITLE_MIN_LENGTH,
    maxTitle: QUIZ_TITLE_MAX_LENGTH,
    minQuestions: MIN_QUESTIONS,
    maxQuestions: MAX_QUESTIONS,
    minTime: MIN_TIME_PER_QUESTION,
    maxTime: MAX_TIME_PER_QUESTION,
    timeStep: TIME_STEP_SECONDS,
  };
}

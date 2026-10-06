import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  Audience,
  Difficulty,
  QuizLanguage,
  QuizSource,
  QuizTheme,
} from '../../core/models/quiz.model';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../shared/forms/form-signals';
import {
  MIN_QUESTIONS,
  QUIZ_TITLE_MAX_LENGTH,
  QUIZ_TITLE_MIN_LENGTH,
  QuestionForm,
  TOPIC_MAX_LENGTH,
  TOPIC_MIN_LENGTH,
  createQuestionForm,
  textLength,
  toQuestionInput,
} from '../../shared/forms/quiz-form';
import { authFeature } from '../../store/auth/auth.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { PathsActions } from '../../store/paths/paths.actions';
import { pathsFeature } from '../../store/paths/paths.reducer';
import { QuizzesActions } from '../../store/quizzes/quizzes.actions';
import { quizzesFeature } from '../../store/quizzes/quizzes.reducer';
import { CreationDoneComponent } from './components/creation-done.component';
import { CreationErrorComponent } from './components/creation-error.component';
import { GenerationProgressComponent } from './components/generation-progress.component';
import { MakeStepComponent } from './components/make-step.component';
import { ManualQuestionsComponent } from './components/manual-questions.component';
import { SettingsStepComponent } from './components/settings-step.component';
import { SourceStepComponent } from './components/source-step.component';
import { WizardStepsComponent } from './components/wizard-steps.component';
import {
  DEFAULT_QUESTION_COUNT,
  DEFAULT_TIME_BY_AUDIENCE,
  GENERATED_STEPS,
  MANUAL_STEPS,
  NEW_PATH_QUERY_PARAMS,
  STEP_TITLES,
} from './create.constants';
import { CreateKind, CreatePhase, WizardStep } from './create.types';
import { LessonUploadService } from './lesson-upload.service';

// Holds every choice of the wizard; each step component only shows and changes its part.
@Component({
  selector: 'app-create-page',
  imports: [
    CreationDoneComponent,
    CreationErrorComponent,
    GenerationProgressComponent,
    MakeStepComponent,
    ManualQuestionsComponent,
    PageHeaderComponent,
    PixelIconComponent,
    SettingsStepComponent,
    SourceStepComponent,
    WizardStepsComponent,
  ],
  providers: [LessonUploadService],
  templateUrl: './create-page.component.html',
  styleUrl: './create-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePageComponent {
  private readonly store = inject(Store);
  private readonly injector = inject(Injector);
  protected readonly lessonUpload = inject(LessonUploadService);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  readonly make = input<string>();

  protected readonly stepTitles = STEP_TITLES;

  protected readonly step = signal<WizardStep>('source');
  protected readonly source = signal<QuizSource>('TOPIC');
  // The pick on the "make" step; links with ?make=path start on a learning path.
  protected readonly chosenKind = linkedSignal<CreateKind>(() =>
    this.make() === NEW_PATH_QUERY_PARAMS.make ? 'PATH' : 'QUIZ',
  );
  protected readonly audience = signal<Audience>('KIDS');
  protected readonly language = signal<QuizLanguage>('EN');
  protected readonly difficulty = signal<Difficulty>('EASY');
  protected readonly theme = signal<QuizTheme>('GENERAL');
  protected readonly questionCount = signal(DEFAULT_QUESTION_COUNT);
  protected readonly timePerQuestion = signal(DEFAULT_TIME_BY_AUDIENCE.KIDS);
  protected readonly questionForms = signal<QuestionForm[]>(blankQuestions());
  protected readonly manualProblem = signal<string | null>(null);

  protected readonly topic = new FormControl('', {
    nonNullable: true,
    validators: textLength(TOPIC_MIN_LENGTH, TOPIC_MAX_LENGTH),
  });
  protected readonly quizTitle = new FormControl('', {
    nonNullable: true,
    validators: textLength(QUIZ_TITLE_MIN_LENGTH, QUIZ_TITLE_MAX_LENGTH),
  });
  protected readonly topicInvalid = touchedAndInvalid(this.topic);
  protected readonly quizTitleInvalid = touchedAndInvalid(this.quizTitle);
  protected readonly topicValue = toSignal(this.topic.valueChanges, { initialValue: '' });
  private readonly quizTitleValue = toSignal(this.quizTitle.valueChanges, { initialValue: '' });

  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly progress = this.store.selectSignal(quizzesFeature.selectProgress);
  protected readonly createdQuiz = this.store.selectSignal(quizzesFeature.selectCreated);
  protected readonly createdPath = this.store.selectSignal(pathsFeature.selectCreated);
  protected readonly startingMatch = this.store.selectSignal(matchFeature.selectBusy);
  private readonly quizCreating = this.store.selectSignal(quizzesFeature.selectCreating);
  private readonly quizError = this.store.selectSignal(quizzesFeature.selectCreationError);
  private readonly pathCreating = this.store.selectSignal(pathsFeature.selectCreating);
  private readonly pathError = this.store.selectSignal(pathsFeature.selectCreationError);

  // What the wizard will make: a quiz written by hand is always a quick quiz.
  protected readonly kindToMake = computed<CreateKind>(() =>
    this.source() === 'MANUAL' ? 'QUIZ' : this.chosenKind(),
  );
  protected readonly steps = computed(() =>
    this.source() === 'MANUAL' ? MANUAL_STEPS : GENERATED_STEPS,
  );
  protected readonly subject = computed(() => {
    if (this.source() === 'DOCUMENT') {
      return this.lessonUpload.document()?.fileName ?? '';
    }
    return this.source() === 'TOPIC' ? this.topicValue().trim() : this.quizTitleValue().trim();
  });
  // What the quiz master is writing right now, for the progress screen.
  protected readonly kindBeingCreated = computed<CreateKind>(() =>
    this.pathCreating() ? 'PATH' : 'QUIZ',
  );
  // Starting a quiz or a path clears its old error, so at most one of them is set.
  protected readonly failure = computed(() => this.quizError() ?? this.pathError());
  protected readonly phase = computed<CreatePhase>(() => {
    if (this.quizCreating() || this.pathCreating()) {
      return 'working';
    }
    if (this.createdQuiz() || this.createdPath()) {
      return 'done';
    }
    return this.failure() ? 'failed' : 'wizard';
  });

  constructor() {
    // A quiz or path still being written keeps its progress screen; anything older starts fresh.
    if (!this.quizCreating() && !this.pathCreating()) {
      this.clearResults();
    }
  }

  protected chooseAudience(audience: Audience): void {
    this.audience.set(audience);
    this.timePerQuestion.set(DEFAULT_TIME_BY_AUDIENCE[audience]);
  }

  protected showStep(step: WizardStep): void {
    this.step.set(step);
    // The pressed button leaves with the old step, so focus moves to the new step's title.
    afterNextRender(() => this.stepHeading()?.nativeElement.focus(), { injector: this.injector });
  }

  protected goBack(): void {
    const steps = this.steps();
    this.showStep(steps[steps.indexOf(this.step()) - 1]);
  }

  protected continueFromSource(): void {
    if (this.source() === 'TOPIC' && this.topic.invalid) {
      this.topic.markAsTouched();
      return;
    }
    this.showStep(this.source() === 'MANUAL' ? 'settings' : 'make');
  }

  protected continueFromSettings(): void {
    if (this.source() !== 'MANUAL') {
      this.generate();
      return;
    }
    if (this.quizTitle.invalid) {
      this.quizTitle.markAsTouched();
      return;
    }
    this.showStep('questions');
  }

  protected addQuestion(): void {
    this.questionForms.update((forms) => [...forms, createQuestionForm()]);
  }

  protected removeQuestion(index: number): void {
    this.questionForms.update((forms) => forms.filter((_, position) => position !== index));
  }

  protected generate(): void {
    const source = this.sourceRequest();
    if (this.kindToMake() === 'PATH') {
      const request = { ...source, audience: this.audience(), language: this.language() };
      this.store.dispatch(PathsActions.create({ request }));
      return;
    }
    this.store.dispatch(
      QuizzesActions.generate({
        request: {
          ...source,
          audience: this.audience(),
          language: this.language(),
          difficulty: this.difficulty(),
          questionCount: this.questionCount(),
          timePerQuestion: this.timePerQuestion(),
        },
      }),
    );
  }

  protected saveManualQuiz(): void {
    const forms = this.questionForms();
    if (this.quizTitle.invalid || forms.some((form) => form.invalid)) {
      this.quizTitle.markAsTouched();
      forms.forEach((form) => form.markAllAsTouched());
      this.manualProblem.set('Some questions still need work. Look for the red notes.');
      return;
    }
    this.manualProblem.set(null);
    const title = this.quizTitle.value.trim();
    this.store.dispatch(
      QuizzesActions.create({
        request: {
          title,
          // A hand-written quiz has no separate topic, so its title is used for both.
          topic: title,
          theme: this.theme(),
          difficulty: this.difficulty(),
          audience: this.audience(),
          language: this.language(),
          timePerQuestion: this.timePerQuestion(),
          questions: forms.map(toQuestionInput),
        },
      }),
    );
  }

  protected retry(): void {
    if (this.source() === 'MANUAL') {
      this.saveManualQuiz();
    } else {
      this.generate();
    }
  }

  protected backToChoices(): void {
    this.clearResults();
  }

  protected play(quizId: string): void {
    this.store.dispatch(MatchActions.create({ request: { quizId, mode: 'SOLO' } }));
  }

  protected startOver(): void {
    this.clearResults();
    this.step.set('source');
    this.topic.reset();
    this.quizTitle.reset();
    this.lessonUpload.clear();
    this.questionForms.set(blankQuestions());
  }

  // A generated quiz or path is about either the typed topic or the uploaded lesson.
  private sourceRequest(): { topic?: string; documentId?: string } {
    if (this.source() === 'TOPIC') {
      return { topic: this.topic.value.trim() };
    }
    return { documentId: this.lessonUpload.document()?.id };
  }

  private clearResults(): void {
    this.store.dispatch(QuizzesActions.creationReset());
    this.store.dispatch(PathsActions.creationReset());
  }
}

function blankQuestions(): QuestionForm[] {
  return Array.from({ length: MIN_QUESTIONS }, () => createQuestionForm());
}

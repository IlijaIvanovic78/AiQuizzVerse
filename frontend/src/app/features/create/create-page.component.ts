import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { readErrorMessage } from '../../core/api/api-error';
import { DocumentsApiService } from '../../core/api/documents-api.service';
import { Audience, Difficulty, QuizLanguage, QuizTheme } from '../../core/models/quiz.model';
import { ChoiceCardComponent } from '../../shared/components/choice-card.component';
import { NumberStepperComponent } from '../../shared/components/number-stepper.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { touchedAndInvalid } from '../../shared/forms/form-signals';
import {
  MAX_QUESTIONS,
  MAX_TIME_PER_QUESTION,
  MIN_QUESTIONS,
  MIN_TIME_PER_QUESTION,
  QUIZ_TITLE_MAX_LENGTH,
  QUIZ_TITLE_MIN_LENGTH,
  QuestionForm,
  TIME_STEP_SECONDS,
  TOPIC_MAX_LENGTH,
  TOPIC_MIN_LENGTH,
  createQuestionForm,
  textLength,
  toQuestionInput,
} from '../../shared/forms/quiz-form';
import { LanguageLabelPipe } from '../../shared/pipes/language-label.pipe';
import { ThemeLabelPipe } from '../../shared/pipes/theme-label.pipe';
import { authFeature } from '../../store/auth/auth.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { PathsActions } from '../../store/paths/paths.actions';
import { pathsFeature } from '../../store/paths/paths.reducer';
import { QuizzesActions } from '../../store/quizzes/quizzes.actions';
import { quizzesFeature } from '../../store/quizzes/quizzes.reducer';
import { AudiencePickerComponent } from './components/audience-picker.component';
import { CreationDoneComponent } from './components/creation-done.component';
import { CreationErrorComponent } from './components/creation-error.component';
import { GenerationProgressComponent } from './components/generation-progress.component';
import { ManualQuestionsComponent } from './components/manual-questions.component';
import { PdfDropzoneComponent } from './components/pdf-dropzone.component';
import { WizardStepsComponent } from './components/wizard-steps.component';
import {
  DEFAULT_QUESTION_COUNT,
  DEFAULT_TIME_BY_AUDIENCE,
  DIFFICULTY_CHOICES,
  GENERATED_STEPS,
  KIND_CHOICES,
  LANGUAGES,
  MANUAL_STEPS,
  NEW_PATH_QUERY_PARAMS,
  QUIZ_THEMES,
  SOURCE_CHOICES,
  TOPIC_SUGGESTIONS,
} from './create.constants';
import { pdfProblem } from './create.rules';
import { CreateKind, CreatePhase, SourceKind, UploadState, WizardStep } from './create.types';

@Component({
  selector: 'app-create-page',
  imports: [
    ReactiveFormsModule,
    LanguageLabelPipe,
    ThemeLabelPipe,
    AudiencePickerComponent,
    ChoiceCardComponent,
    CreationDoneComponent,
    CreationErrorComponent,
    GenerationProgressComponent,
    ManualQuestionsComponent,
    NumberStepperComponent,
    PageHeaderComponent,
    PdfDropzoneComponent,
    PixelIconComponent,
    WizardStepsComponent,
  ],
  templateUrl: './create-page.component.html',
  styleUrl: './create-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePageComponent {
  private readonly store = inject(Store);
  private readonly documentsApi = inject(DocumentsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  readonly make = input<string>();

  protected readonly sourceChoices = SOURCE_CHOICES;
  protected readonly kindChoices = KIND_CHOICES;
  protected readonly suggestions = TOPIC_SUGGESTIONS;
  protected readonly languages = LANGUAGES;
  protected readonly difficulties = DIFFICULTY_CHOICES;
  protected readonly themes = QUIZ_THEMES;
  protected readonly limits = {
    topic: TOPIC_MAX_LENGTH,
    title: QUIZ_TITLE_MAX_LENGTH,
    minQuestions: MIN_QUESTIONS,
    maxQuestions: MAX_QUESTIONS,
    minTime: MIN_TIME_PER_QUESTION,
    maxTime: MAX_TIME_PER_QUESTION,
    timeStep: TIME_STEP_SECONDS,
  };

  protected readonly step = signal<WizardStep>('source');
  protected readonly source = signal<SourceKind>('TOPIC');
  protected readonly kind = linkedSignal<CreateKind>(() =>
    this.make() === NEW_PATH_QUERY_PARAMS.make ? 'PATH' : 'QUIZ',
  );
  protected readonly audience = signal<Audience>('KIDS');
  protected readonly language = signal<QuizLanguage>('EN');
  protected readonly difficulty = signal<Difficulty>('EASY');
  protected readonly theme = signal<QuizTheme>('GENERAL');
  protected readonly questionCount = signal(DEFAULT_QUESTION_COUNT);
  protected readonly timePerQuestion = signal(DEFAULT_TIME_BY_AUDIENCE.KIDS);
  protected readonly upload = signal<UploadState>({ status: 'idle' });
  protected readonly questionForms = signal<QuestionForm[]>(blankQuestions());
  protected readonly manualProblem = signal<string | null>(null);

  protected readonly topic = new FormControl('', {
    nonNullable: true,
    validators: textLength(TOPIC_MIN_LENGTH, TOPIC_MAX_LENGTH),
  });
  protected readonly title = new FormControl('', {
    nonNullable: true,
    validators: textLength(QUIZ_TITLE_MIN_LENGTH, QUIZ_TITLE_MAX_LENGTH),
  });
  protected readonly topicInvalid = touchedAndInvalid(this.topic);
  protected readonly titleInvalid = touchedAndInvalid(this.title);
  protected readonly topicValue = toSignal(this.topic.valueChanges, { initialValue: '' });
  private readonly titleValue = toSignal(this.title.valueChanges, { initialValue: '' });

  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly progress = this.store.selectSignal(quizzesFeature.selectProgress);
  protected readonly createdQuiz = this.store.selectSignal(quizzesFeature.selectCreated);
  protected readonly createdPath = this.store.selectSignal(pathsFeature.selectCreated);
  protected readonly startingMatch = this.store.selectSignal(matchFeature.selectBusy);
  private readonly quizCreating = this.store.selectSignal(quizzesFeature.selectCreating);
  private readonly quizError = this.store.selectSignal(quizzesFeature.selectCreationError);
  private readonly pathCreating = this.store.selectSignal(pathsFeature.selectCreating);
  private readonly pathError = this.store.selectSignal(pathsFeature.selectCreationError);

  // A quiz written by hand is always a quick quiz.
  protected readonly makeKind = computed<CreateKind>(() =>
    this.source() === 'MANUAL' ? 'QUIZ' : this.kind(),
  );
  protected readonly steps = computed(() =>
    this.source() === 'MANUAL' ? MANUAL_STEPS : GENERATED_STEPS,
  );
  protected readonly lessonDocument = computed(() => {
    const upload = this.upload();
    return upload.status === 'ready' ? upload.document : null;
  });
  protected readonly subject = computed(() => {
    if (this.source() === 'PDF') {
      return this.lessonDocument()?.fileName ?? '';
    }
    return this.source() === 'TOPIC' ? this.topicValue().trim() : this.titleValue().trim();
  });
  protected readonly workingKind = computed<CreateKind>(() =>
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
    // A quiz still being written keeps its progress screen; anything older starts fresh.
    if (!this.quizCreating() && !this.pathCreating()) {
      this.clearResults();
    }
  }

  protected chooseAudience(audience: Audience): void {
    this.audience.set(audience);
    this.timePerQuestion.set(DEFAULT_TIME_BY_AUDIENCE[audience]);
  }

  protected suggestTopic(topic: string): void {
    this.topic.setValue(topic);
    this.topic.markAsTouched();
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
    if (this.title.invalid) {
      this.title.markAsTouched();
      return;
    }
    this.showStep('questions');
  }

  protected uploadLesson(file: File): void {
    const problem = pdfProblem(file);
    if (problem) {
      this.upload.set({ status: 'failed', message: problem });
      return;
    }
    this.upload.set({ status: 'uploading', fileName: file.name });
    this.documentsApi
      .upload(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (document) => this.upload.set({ status: 'ready', document }),
        error: (error: unknown) =>
          this.upload.set({ status: 'failed', message: readErrorMessage(error) }),
      });
  }

  protected removeLesson(): void {
    this.upload.set({ status: 'idle' });
  }

  protected addQuestion(): void {
    this.questionForms.update((forms) => [...forms, createQuestionForm()]);
  }

  protected removeQuestion(index: number): void {
    this.questionForms.update((forms) => forms.filter((_, position) => position !== index));
  }

  protected generate(): void {
    const source = this.sourceRequest();
    if (this.makeKind() === 'PATH') {
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
    if (this.title.invalid || forms.some((form) => form.invalid)) {
      this.title.markAsTouched();
      forms.forEach((form) => form.markAllAsTouched());
      this.manualProblem.set('Some questions still need work. Look for the red notes.');
      return;
    }
    this.manualProblem.set(null);
    const title = this.title.value.trim();
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
    this.title.reset();
    this.upload.set({ status: 'idle' });
    this.questionForms.set(blankQuestions());
  }

  // A generated quiz or path is about either the typed topic or the uploaded lesson.
  private sourceRequest(): { topic?: string; documentId?: string } {
    const document = this.lessonDocument();
    if (this.source() === 'PDF' && document) {
      return { documentId: document.id };
    }
    return { topic: this.topic.value.trim() };
  }

  private clearResults(): void {
    this.store.dispatch(QuizzesActions.creationReset());
    this.store.dispatch(PathsActions.creationReset());
  }
}

function blankQuestions(): QuestionForm[] {
  return Array.from({ length: MIN_QUESTIONS }, () => createQuestionForm());
}

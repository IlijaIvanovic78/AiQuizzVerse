import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatchMode } from '../../core/models/match.model';
import {
  QuestionInput,
  QuestionView,
  QuizDetail,
  UpdateQuizRequest,
} from '../../core/models/quiz.model';
import { ChoiceCardComponent } from '../../shared/components/choice-card.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';
import { HeroSpriteComponent } from '../../shared/components/hero-sprite.component';
import { PixelIconComponent } from '../../shared/components/pixel-icon.component';
import { PlayChoice, PlayModalComponent } from '../../shared/components/play-modal.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { ThemeBadgeComponent } from '../../shared/components/theme-badge.component';
import { MAX_QUESTIONS, MIN_QUESTIONS } from '../../shared/forms/quiz-form';
import { itemIconUrl } from '../../shared/icons';
import { AudienceLabelPipe } from '../../shared/pipes/audience-label.pipe';
import { LanguageLabelPipe } from '../../shared/pipes/language-label.pipe';
import { MODE_CHOICES } from '../../shared/play-modes';
import { authFeature } from '../../store/auth/auth.reducer';
import { FriendsActions } from '../../store/friends/friends.actions';
import { friendsFeature } from '../../store/friends/friends.reducer';
import { MatchActions } from '../../store/match/match.actions';
import { matchFeature } from '../../store/match/match.reducer';
import { QuizzesActions } from '../../store/quizzes/quizzes.actions';
import { quizzesFeature } from '../../store/quizzes/quizzes.reducer';
import { EditableQuestionComponent } from './components/editable-question.component';
import { QuestionModalComponent } from './components/question-modal.component';
import { QuizSettingsModalComponent } from './components/quiz-settings-modal.component';
import { SOURCE_LABELS } from './library.constants';

// The question being written in the modal: an existing one, or null for a new one.
interface QuestionDraft {
  question: QuestionView | null;
  number: number;
}

@Component({
  selector: 'app-quiz-detail-page',
  imports: [
    RouterLink,
    AudienceLabelPipe,
    LanguageLabelPipe,
    ChoiceCardComponent,
    ConfirmDialogComponent,
    DifficultyBadgeComponent,
    EditableQuestionComponent,
    HeroSpriteComponent,
    PixelIconComponent,
    PlayModalComponent,
    QuestionModalComponent,
    QuizSettingsModalComponent,
    SpinnerComponent,
    ThemeBadgeComponent,
  ],
  templateUrl: './quiz-detail-page.component.html',
  styleUrl: './quiz-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizDetailPageComponent {
  private readonly store = inject(Store);

  readonly quizId = input.required<string>();

  protected readonly modeChoices = MODE_CHOICES;
  protected readonly itemIconUrl = itemIconUrl;
  protected readonly sourceLabels = SOURCE_LABELS;
  protected readonly minQuestions = MIN_QUESTIONS;

  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly error = this.store.selectSignal(quizzesFeature.selectError);
  protected readonly saving = this.store.selectSignal(quizzesFeature.selectSaving);
  protected readonly onlineFriends = this.store.selectSignal(friendsFeature.selectOnlineFriends);
  protected readonly friendsLoading = this.store.selectSignal(friendsFeature.selectLoading);
  protected readonly startingMatch = this.store.selectSignal(matchFeature.selectBusy);
  private readonly detail = this.store.selectSignal(quizzesFeature.selectDetail);

  // The store keeps one quiz detail; it may still be the previous quiz while this one loads.
  protected readonly quiz = computed(() => {
    const detail = this.detail();
    return detail?.id === this.quizId() ? detail : null;
  });
  protected readonly canAddQuestion = computed(
    () => (this.quiz()?.questions.length ?? 0) < MAX_QUESTIONS,
  );
  protected readonly canDeleteQuestion = computed(
    () => (this.quiz()?.questions.length ?? 0) > MIN_QUESTIONS,
  );

  protected readonly showAnswers = signal(false);
  protected readonly draft = signal<QuestionDraft | null>(null);
  protected readonly removing = signal<QuestionView | null>(null);
  protected readonly editingDetails = signal(false);
  protected readonly deletingQuiz = signal(false);
  protected readonly friendMode = signal<MatchMode | null>(null);

  constructor() {
    effect(() => {
      const quizId = this.quizId();
      untracked(() => this.load(quizId));
    });
  }

  protected reload(): void {
    this.load(this.quizId());
  }

  protected chooseMode(quiz: QuizDetail, mode: MatchMode): void {
    if (mode === 'SOLO') {
      this.startMatch(quiz, { mode });
      return;
    }
    this.friendMode.set(mode);
    this.store.dispatch(FriendsActions.load());
  }

  protected startMatch(quiz: QuizDetail, choice: PlayChoice): void {
    this.store.dispatch(MatchActions.create({ request: { quizId: quiz.id, ...choice } }));
  }

  protected toggleAnswers(): void {
    this.showAnswers.update((shown) => !shown);
  }

  protected editQuestion(question: QuestionView, number: number): void {
    this.draft.set({ question, number });
  }

  protected addQuestion(quiz: QuizDetail): void {
    this.draft.set({ question: null, number: quiz.questions.length + 1 });
  }

  // The modal closes right away; a failed save shows the server message as a toast.
  protected saveQuestion(quiz: QuizDetail, question: QuestionInput): void {
    const editing = this.draft()?.question;
    if (editing) {
      this.store.dispatch(
        QuizzesActions.updateQuestion({ quizId: quiz.id, questionId: editing.id, question }),
      );
    } else {
      this.store.dispatch(QuizzesActions.addQuestion({ quizId: quiz.id, question }));
    }
    this.draft.set(null);
  }

  protected deleteQuestion(quiz: QuizDetail, question: QuestionView): void {
    this.store.dispatch(
      QuizzesActions.deleteQuestion({ quizId: quiz.id, questionId: question.id }),
    );
    this.removing.set(null);
  }

  protected saveDetails(quiz: QuizDetail, changes: UpdateQuizRequest): void {
    this.store.dispatch(QuizzesActions.update({ quizId: quiz.id, changes }));
    this.editingDetails.set(false);
  }

  // The dialog stays open and busy until the quiz is gone and the page leaves for the library.
  protected deleteQuiz(quiz: QuizDetail): void {
    this.store.dispatch(QuizzesActions.delete({ quizId: quiz.id }));
  }

  private load(quizId: string): void {
    this.store.dispatch(QuizzesActions.loadDetail({ quizId }));
  }
}

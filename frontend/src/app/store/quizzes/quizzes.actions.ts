import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  CreateQuizRequest,
  GenerateQuizRequest,
  QuestionInput,
  QuestionView,
  QuizDetail,
  QuizSummary,
  UpdateQuizRequest,
} from '../../core/models/quiz.model';
import { QuizProgress } from '../../core/models/realtime-events.model';

export const QuizzesActions = createActionGroup({
  source: 'Quizzes',
  events: {
    Load: emptyProps(),
    Loaded: props<{ quizzes: QuizSummary[] }>(),
    'Load Featured': emptyProps(),
    'Featured Loaded': props<{ quizzes: QuizSummary[] }>(),
    'Load Detail': props<{ quizId: string }>(),
    'Detail Loaded': props<{ quiz: QuizDetail }>(),
    Create: props<{ request: CreateQuizRequest }>(),
    Generate: props<{ request: GenerateQuizRequest }>(),
    Created: props<{ quiz: QuizDetail }>(),
    'Creation Reset': emptyProps(),
    'Progress Received': props<{ progress: QuizProgress }>(),
    Update: props<{ quizId: string; changes: UpdateQuizRequest }>(),
    Updated: props<{ quiz: QuizDetail }>(),
    'Add Question': props<{ quizId: string; question: QuestionInput }>(),
    'Question Added': props<{ quizId: string; question: QuestionView }>(),
    'Update Question': props<{ quizId: string; questionId: string; question: QuestionInput }>(),
    'Question Updated': props<{ quizId: string; question: QuestionView }>(),
    'Delete Question': props<{ quizId: string; questionId: string }>(),
    'Question Deleted': props<{ quizId: string; questionId: string }>(),
    Delete: props<{ quizId: string }>(),
    Deleted: props<{ quizId: string }>(),
    Failed: props<{ error: string }>(),
  },
});

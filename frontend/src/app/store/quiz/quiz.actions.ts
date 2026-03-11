import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Quiz, QuizListItem, GenerateQuizRequest, UploadPdfResponse } from '../../models';

export const QuizActions = createActionGroup({
  source: 'Quiz',
  events: {
    // Generate Quiz
    'Generate Quiz': props<{ request: GenerateQuizRequest }>(),
    'Generate Quiz Success': props<{ quiz: Quiz }>(),
    'Generate Quiz Failure': props<{ error: string }>(),

    // Upload PDF
    'Upload Pdf': props<{ file: File }>(),
    'Upload Pdf Success': props<{ response: UploadPdfResponse }>(),
    'Upload Pdf Failure': props<{ error: string }>(),
    'Clear Uploaded File': emptyProps(),

    // Load My Quizzes
    'Load My Quizzes': emptyProps(),
    'Load My Quizzes Success': props<{ quizzes: QuizListItem[] }>(),
    'Load My Quizzes Failure': props<{ error: string }>(),

    // Load Quiz Detail
    'Load Quiz Detail': props<{ quizId: string }>(),
    'Load Quiz Detail Success': props<{ quiz: Quiz }>(),
    'Load Quiz Detail Failure': props<{ error: string }>(),

    // Delete Quiz
    'Delete Quiz': props<{ quizId: string }>(),
    'Delete Quiz Success': props<{ quizId: string }>(),
    'Delete Quiz Failure': props<{ error: string }>(),

    // UI State
    'Clear Error': emptyProps(),
    'Clear Current Quiz': emptyProps(),
  },
});

import { Quiz, QuizListItem } from '../../models';

export interface QuizState {
  /** List of user's quizzes (from GET /quizzes) */
  quizzes: QuizListItem[];

  /** Currently selected quiz with full questions */
  currentQuiz: Quiz | null;

  /** Whether AI is generating a quiz */
  generating: boolean;

  /** Whether a PDF is being uploaded */
  uploading: boolean;

  /** Name of the uploaded PDF file (null if none) */
  uploadedFileName: string | null;

  /** General loading state (list, detail, delete) */
  loading: boolean;

  /** Error message from failed operations */
  error: string | null;
}

export const initialQuizState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  generating: false,
  uploading: false,
  uploadedFileName: null,
  loading: false,
  error: null,
};

import { QuizSummary } from '../core/models/quiz.model';

// The demo quizzes are featured for everyone, and their owner already has them in the library.
export function notInLibrary(featured: QuizSummary[], mine: QuizSummary[]): QuizSummary[] {
  const myIds = new Set(mine.map((quiz) => quiz.id));
  return featured.filter((quiz) => !myIds.has(quiz.id));
}

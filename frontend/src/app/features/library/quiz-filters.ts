import { QuizSummary, QuizTheme } from '../../core/models/quiz.model';

export interface ThemeCount {
  theme: QuizTheme;
  count: number;
}

// The most common themes come first; Map.set returns the map, so reduce can keep it going.
export function countByTheme(quizzes: QuizSummary[]): ThemeCount[] {
  const counts = quizzes.reduce(
    (totals, quiz) => totals.set(quiz.theme, (totals.get(quiz.theme) ?? 0) + 1),
    new Map<QuizTheme, number>(),
  );
  return Array.from(counts, ([theme, count]) => ({ theme, count })).sort(
    (a, b) => b.count - a.count,
  );
}

export function filterQuizzes(
  quizzes: QuizSummary[],
  text: string,
  theme: QuizTheme | null,
): QuizSummary[] {
  const search = text.trim().toLowerCase();
  return quizzes.filter((quiz) => hasTheme(quiz, theme) && containsText(quiz, search));
}

// The demo quizzes are featured for everyone, and their owner already has them in the library.
export function notInLibrary(featured: QuizSummary[], mine: QuizSummary[]): QuizSummary[] {
  const myIds = new Set(mine.map((quiz) => quiz.id));
  return featured.filter((quiz) => !myIds.has(quiz.id));
}

function hasTheme(quiz: QuizSummary, theme: QuizTheme | null): boolean {
  return theme === null || quiz.theme === theme;
}

function containsText(quiz: QuizSummary, search: string): boolean {
  return (
    search === '' ||
    quiz.title.toLowerCase().includes(search) ||
    quiz.topic.toLowerCase().includes(search)
  );
}

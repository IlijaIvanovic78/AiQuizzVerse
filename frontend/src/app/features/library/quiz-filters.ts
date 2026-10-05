import { QuizSummary, QuizTheme } from '../../core/models/quiz.model';

export interface ThemeCount {
  theme: QuizTheme;
  count: number;
}

// The most common themes come first.
export function countByTheme(quizzes: QuizSummary[]): ThemeCount[] {
  const counts = quizzes.reduce((totals, quiz) => {
    totals.set(quiz.theme, (totals.get(quiz.theme) ?? 0) + 1);
    return totals;
  }, new Map<QuizTheme, number>());
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

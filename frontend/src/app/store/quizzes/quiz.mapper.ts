import { QuizDetail, QuizSummary } from '../../core/models/quiz.model';

export function toQuizSummary(quiz: QuizDetail): QuizSummary {
  return {
    id: quiz.id,
    title: quiz.title,
    topic: quiz.topic,
    theme: quiz.theme,
    difficulty: quiz.difficulty,
    audience: quiz.audience,
    language: quiz.language,
    questionCount: quiz.questions.length,
    timePerQuestion: quiz.timePerQuestion,
    source: quiz.source,
    createdAt: quiz.createdAt,
    bestAccuracy: quiz.bestAccuracy,
  };
}

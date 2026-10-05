import { Prisma, Question, Quiz } from '@prisma/client';

export type QuizWithQuestions = Quiz & { questions: Question[] };

export function toQuizCopy(
  quiz: QuizWithQuestions,
  ownerId: string,
): Prisma.QuizUncheckedCreateInput {
  return {
    title: quiz.title,
    topic: quiz.topic,
    theme: quiz.theme,
    difficulty: quiz.difficulty,
    audience: quiz.audience,
    language: quiz.language,
    kind: quiz.kind,
    timePerQuestion: quiz.timePerQuestion,
    ownerId,
    questions: {
      create: quiz.questions.map((question) => ({
        position: question.position,
        text: question.text,
        options: question.options,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
        hint: question.hint,
      })),
    },
  };
}

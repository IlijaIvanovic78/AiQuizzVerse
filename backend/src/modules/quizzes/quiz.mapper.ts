import { Prisma, Question, Quiz } from '@prisma/client';
import { accuracyPercent } from '../progression/progression.rules';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { FULL_ACCURACY } from './quizzes.constants';
import {
  GeneratedQuizToSave,
  QuestionContent,
  QuestionView,
  QuizDetail,
  QuizSummary,
} from './quizzes.types';

type QuizWithQuestions = Quiz & { questions: Question[] };

/** Question count plus the viewer's own finished matches, for bestAccuracy. */
export function quizSummaryInclude(userId: string) {
  return {
    _count: { select: { questions: true } },
    matches: {
      where: { status: 'FINISHED', players: { some: { userId } } },
      select: { players: { where: { userId }, select: { correctCount: true } } },
    },
  } satisfies Prisma.QuizInclude;
}

export function quizDetailInclude(userId: string) {
  return {
    ...quizSummaryInclude(userId),
    questions: { orderBy: { position: 'asc' } },
  } satisfies Prisma.QuizInclude;
}

type QuizSummaryRow = Prisma.QuizGetPayload<{ include: ReturnType<typeof quizSummaryInclude> }>;
type QuizDetailRow = Prisma.QuizGetPayload<{ include: ReturnType<typeof quizDetailInclude> }>;

export function toQuizSummary(quiz: QuizSummaryRow): QuizSummary {
  return {
    id: quiz.id,
    title: quiz.title,
    topic: quiz.topic,
    theme: quiz.theme,
    difficulty: quiz.difficulty,
    audience: quiz.audience,
    language: quiz.language,
    questionCount: quiz._count.questions,
    timePerQuestion: quiz.timePerQuestion,
    source: quiz.source,
    createdAt: quiz.createdAt,
    bestAccuracy: bestAccuracy(quiz),
  };
}

export function toQuizDetail(quiz: QuizDetailRow): QuizDetail {
  return { ...toQuizSummary(quiz), questions: quiz.questions.map(toQuestionView) };
}

export function toQuestionView(question: Question): QuestionView {
  return { id: question.id, position: question.position, ...questionFields(question) };
}

export function questionFields(question: QuestionContent): QuestionContent {
  return {
    text: question.text,
    options: question.options,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    hint: question.hint,
  };
}

export function toManualQuizData(
  ownerId: string,
  dto: CreateQuizDto,
): Prisma.QuizUncheckedCreateInput {
  return {
    title: dto.title,
    topic: dto.topic,
    theme: dto.theme,
    difficulty: dto.difficulty,
    audience: dto.audience,
    language: dto.language,
    kind: 'STANDARD',
    source: 'MANUAL',
    timePerQuestion: dto.timePerQuestion,
    ownerId,
    questions: { create: numberedQuestions(dto.questions) },
  };
}

export function toGeneratedQuizData(input: GeneratedQuizToSave): Prisma.QuizUncheckedCreateInput {
  return {
    title: input.quiz.title,
    topic: input.topic,
    theme: input.quiz.theme,
    difficulty: input.difficulty,
    audience: input.audience,
    language: input.language,
    kind: input.kind,
    source: input.documentId ? 'DOCUMENT' : 'TOPIC',
    timePerQuestion: input.timePerQuestion,
    ownerId: input.ownerId,
    documentId: input.documentId,
    questions: { create: numberedQuestions(input.quiz.questions) },
  };
}

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
    source: quiz.source,
    timePerQuestion: quiz.timePerQuestion,
    ownerId,
    questions: {
      create: quiz.questions.map((question) => ({
        position: question.position,
        ...questionFields(question),
      })),
    },
  };
}

function numberedQuestions(questions: QuestionContent[]): Prisma.QuestionCreateWithoutQuizInput[] {
  return questions.map((question, index) => ({ position: index + 1, ...questionFields(question) }));
}

function bestAccuracy(quiz: QuizSummaryRow): number | null {
  const correctCounts = quiz.matches.flatMap((match) =>
    match.players.map((player) => player.correctCount),
  );
  if (correctCounts.length === 0) {
    return null;
  }
  const accuracy = accuracyPercent(Math.max(...correctCounts), quiz._count.questions);
  // The best run is compared with today's question count, and questions removed after
  // that run could push it above 100%.
  return Math.min(accuracy, FULL_ACCURACY);
}

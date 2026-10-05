import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Quiz } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuestionInputDto } from './dto/question-input.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import {
  questionFields,
  quizDetailInclude,
  quizSummaryInclude,
  toGeneratedQuizData,
  toManualQuizData,
  toQuestionView,
  toQuizCopy,
  toQuizDetail,
  toQuizSummary,
} from './quiz.mapper';
import {
  FEATURED_QUIZ_IDS,
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  QUIZ_NOT_FOUND_MESSAGE,
  STARTER_QUIZ_IDS,
} from './quizzes.constants';
import { GeneratedQuizToSave, QuestionView, QuizDetail, QuizSummary } from './quizzes.types';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async copyStarterQuizzes(userId: string): Promise<void> {
    const starters = await this.prisma.quiz.findMany({
      where: { id: { in: STARTER_QUIZ_IDS }, deletedAt: null },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
    await this.prisma.$transaction(
      starters.map((quiz) => this.prisma.quiz.create({ data: toQuizCopy(quiz, userId) })),
    );
  }

  async findMine(userId: string): Promise<QuizSummary[]> {
    const quizzes = await this.prisma.quiz.findMany({
      where: { ownerId: userId, kind: 'STANDARD', deletedAt: null },
      include: quizSummaryInclude(userId),
      orderBy: { createdAt: 'desc' },
    });
    return quizzes.map(toQuizSummary);
  }

  async findFeatured(userId: string): Promise<QuizSummary[]> {
    const quizzes = await this.prisma.quiz.findMany({
      where: { id: { in: FEATURED_QUIZ_IDS }, deletedAt: null },
      include: quizSummaryInclude(userId),
    });
    return quizzes
      .sort((a, b) => FEATURED_QUIZ_IDS.indexOf(a.id) - FEATURED_QUIZ_IDS.indexOf(b.id))
      .map(toQuizSummary);
  }

  async findDetail(userId: string, quizId: string): Promise<QuizDetail> {
    await this.findOwnQuiz(userId, quizId);
    return this.loadDetail(userId, quizId);
  }

  async create(userId: string, dto: CreateQuizDto): Promise<QuizDetail> {
    const quiz = await this.prisma.quiz.create({
      data: toManualQuizData(userId, dto),
      select: { id: true },
    });
    return this.loadDetail(userId, quiz.id);
  }

  async update(userId: string, quizId: string, dto: UpdateQuizDto): Promise<QuizDetail> {
    await this.findEditableQuiz(userId, quizId);
    await this.prisma.quiz.update({
      where: { id: quizId },
      data: { title: dto.title, timePerQuestion: dto.timePerQuestion },
    });
    return this.loadDetail(userId, quizId);
  }

  async remove(userId: string, quizId: string): Promise<void> {
    await this.findEditableQuiz(userId, quizId);
    await this.assertNotBeingPlayed(quizId);
    await this.prisma.quiz.update({ where: { id: quizId }, data: { deletedAt: new Date() } });
  }

  async addQuestion(userId: string, quizId: string, dto: QuestionInputDto): Promise<QuestionView> {
    await this.findEditableQuiz(userId, quizId);
    const stats = await this.prisma.question.aggregate({
      where: { quizId },
      _count: true,
      _max: { position: true },
    });
    if (stats._count >= MAX_QUESTIONS) {
      throw new BadRequestException(`A quiz can have at most ${MAX_QUESTIONS} questions.`);
    }

    const question = await this.prisma.question.create({
      data: { quizId, position: (stats._max.position ?? 0) + 1, ...questionFields(dto) },
    });
    return toQuestionView(question);
  }

  async updateQuestion(
    userId: string,
    quizId: string,
    questionId: string,
    dto: QuestionInputDto,
  ): Promise<QuestionView> {
    await this.findEditableQuiz(userId, quizId);
    await this.assertQuestionInQuiz(quizId, questionId);
    const question = await this.prisma.question.update({
      where: { id: questionId },
      data: questionFields(dto),
    });
    return toQuestionView(question);
  }

  async removeQuestion(userId: string, quizId: string, questionId: string): Promise<void> {
    await this.findEditableQuiz(userId, quizId);
    await this.assertNotBeingPlayed(quizId);
    await this.assertQuestionInQuiz(quizId, questionId);
    const questionCount = await this.prisma.question.count({ where: { quizId } });
    if (questionCount <= MIN_QUESTIONS) {
      throw new BadRequestException(`A quiz needs at least ${MIN_QUESTIONS} questions.`);
    }
    await this.prisma.question.delete({ where: { id: questionId } });
  }

  /** Learning paths call this inside their own transaction. */
  async saveGeneratedQuiz(
    input: GeneratedQuizToSave,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const quiz = await db.quiz.create({ data: toGeneratedQuizData(input), select: { id: true } });
    return quiz.id;
  }

  private async loadDetail(userId: string, quizId: string): Promise<QuizDetail> {
    const quiz = await this.prisma.quiz.findUniqueOrThrow({
      where: { id: quizId },
      include: quizDetailInclude(userId),
    });
    return toQuizDetail(quiz);
  }

  private async findOwnQuiz(userId: string, quizId: string): Promise<Quiz> {
    const quiz = await this.prisma.quiz.findFirst({ where: { id: quizId, deletedAt: null } });
    if (!quiz) {
      throw new NotFoundException(QUIZ_NOT_FOUND_MESSAGE);
    }
    if (quiz.ownerId !== userId) {
      throw new ForbiddenException('This quiz belongs to someone else.');
    }
    return quiz;
  }

  private async findEditableQuiz(userId: string, quizId: string): Promise<Quiz> {
    const quiz = await this.findOwnQuiz(userId, quizId);
    if (quiz.kind !== 'STANDARD') {
      throw new ConflictException('Learning path and review quizzes cannot be changed.');
    }
    if (FEATURED_QUIZ_IDS.includes(quiz.id)) {
      throw new ConflictException(
        'Featured quizzes are shared with everyone and cannot be changed.',
      );
    }
    return quiz;
  }

  // A running match still saves answers to this quiz's questions, so neither the quiz nor
  // one of its questions can be removed until the match ends.
  private async assertNotBeingPlayed(quizId: string): Promise<void> {
    const runningMatches = await this.prisma.match.count({
      where: { quizId, status: 'IN_PROGRESS' },
    });
    if (runningMatches > 0) {
      throw new ConflictException(
        'This quiz is being played right now. Try again after the match.',
      );
    }
  }

  private async assertQuestionInQuiz(quizId: string, questionId: string): Promise<void> {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, quizId },
      select: { id: true },
    });
    if (!question) {
      throw new NotFoundException('We could not find that question.');
    }
  }
}

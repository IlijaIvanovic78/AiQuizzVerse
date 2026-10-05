import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { utcToday } from '../../common/utils/dates';
import { PrismaService } from '../../prisma/prisma.service';
import { PracticeDto } from './dto/practice.dto';
import { MAX_PRACTICE_QUESTIONS } from './review.constants';
import {
  REVIEW_CARD_INCLUDE,
  ReviewCardRow,
  toPracticeQuizData,
  toReviewCardView,
} from './review.mapper';
import { isDue, isMastered, nextReviewDate } from './review.rules';
import { PracticeQuiz, ReviewAnswer, ReviewDeck } from './review.types';

const DUE_FIRST = [
  { dueOn: 'asc' },
  { timesWrong: 'desc' },
] satisfies Prisma.ReviewCardOrderByWithRelationInput[];

const FROM_ACTIVE_QUIZ = { quiz: { deletedAt: null } } satisfies Prisma.QuestionWhereInput;

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async findDeck(userId: string): Promise<ReviewDeck> {
    const today = utcToday();
    const cards = await this.prisma.reviewCard.findMany({
      where: { userId, question: FROM_ACTIVE_QUIZ },
      include: REVIEW_CARD_INCLUDE,
      orderBy: DUE_FIRST,
    });
    return {
      dueToday: cards.filter((card) => isDue(card.dueOn, today)).length,
      total: cards.length,
      cards: cards.map(toReviewCardView),
    };
  }

  countDue(userId: string): Promise<number> {
    return this.prisma.reviewCard.count({ where: dueCardsOf(userId) });
  }

  async startPractice(userId: string, dto: PracticeDto): Promise<PracticeQuiz> {
    const cards = dto.questionIds
      ? await this.findChosenCards(userId, dto.questionIds)
      : await this.findDueCards(userId);
    if (cards.length === 0) {
      throw new BadRequestException('There are no mistakes to practice right now. Great job!');
    }

    const quiz = await this.prisma.quiz.create({
      data: toPracticeQuizData(userId, cards),
      select: { id: true },
    });
    return { quizId: quiz.id };
  }

  async recordAnswers(
    userId: string,
    answers: ReviewAnswer[],
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const today = utcToday();
    const existingIds = await this.findExistingQuestionIds(db, answers);
    const answersToRecord = answers.filter((answer) => existingIds.has(answer.questionId));
    for (const answer of answersToRecord) {
      if (answer.correct) {
        await this.recordCorrectAnswer(db, userId, answer.questionId, today);
      } else {
        await this.recordMistake(db, userId, answer.questionId, today);
      }
    }
  }

  private findDueCards(userId: string): Promise<ReviewCardRow[]> {
    return this.prisma.reviewCard.findMany({
      where: dueCardsOf(userId),
      include: REVIEW_CARD_INCLUDE,
      orderBy: DUE_FIRST,
      take: MAX_PRACTICE_QUESTIONS,
    });
  }

  /** Only questions from the player's own notebook are copied, due or not. */
  private async findChosenCards(userId: string, questionIds: string[]): Promise<ReviewCardRow[]> {
    const originalIds = await this.findOriginalQuestionIds(questionIds);
    return this.prisma.reviewCard.findMany({
      where: { userId, questionId: { in: originalIds }, question: FROM_ACTIVE_QUIZ },
      include: REVIEW_CARD_INCLUDE,
      orderBy: DUE_FIRST,
      take: MAX_PRACTICE_QUESTIONS,
    });
  }

  // Missed questions of a review match are copies, but their cards sit on the original questions.
  private async findOriginalQuestionIds(questionIds: string[]): Promise<string[]> {
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, sourceQuestionId: true },
    });
    return questions.map((question) => question.sourceQuestionId ?? question.id);
  }

  // A review copy outlives its original when the owner deletes that question, and a card
  // for a missing question would make the whole match fail to save.
  private async findExistingQuestionIds(
    db: Prisma.TransactionClient,
    answers: ReviewAnswer[],
  ): Promise<Set<string>> {
    const questions = await db.question.findMany({
      where: { id: { in: answers.map((answer) => answer.questionId) } },
      select: { id: true },
    });
    return new Set(questions.map((question) => question.id));
  }

  private async recordMistake(
    db: Prisma.TransactionClient,
    userId: string,
    questionId: string,
    today: Date,
  ): Promise<void> {
    const dueOn = nextReviewDate(0, today);
    await db.reviewCard.upsert({
      where: { userId_questionId: { userId, questionId } },
      create: { userId, questionId, dueOn },
      update: { timesWrong: { increment: 1 }, correctStreak: 0, dueOn },
    });
  }

  // Only a review on or after the due day counts, so replaying a quiz right away
  // cannot master it.
  private async recordCorrectAnswer(
    db: Prisma.TransactionClient,
    userId: string,
    questionId: string,
    today: Date,
  ): Promise<void> {
    const card = await db.reviewCard.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    if (!card || !isDue(card.dueOn, today)) {
      return;
    }

    const correctStreak = card.correctStreak + 1;
    if (isMastered(correctStreak)) {
      await db.reviewCard.delete({ where: { id: card.id } });
      return;
    }
    await db.reviewCard.update({
      where: { id: card.id },
      data: { correctStreak, dueOn: nextReviewDate(correctStreak, today) },
    });
  }
}

function dueCardsOf(userId: string): Prisma.ReviewCardWhereInput {
  return { userId, dueOn: { lte: utcToday() }, question: FROM_ACTIVE_QUIZ };
}

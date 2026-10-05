import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { utcToday } from '../../common/utils/dates';
import { PrismaService } from '../../prisma/prisma.service';
import { isDue, isMastered, nextReviewDate } from './review.rules';
import { ReviewAnswer } from './review.types';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAnswers(
    userId: string,
    answers: ReviewAnswer[],
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const today = utcToday();
    for (const answer of answers) {
      if (answer.correct) {
        await this.recordCorrectAnswer(db, userId, answer.questionId, today);
      } else {
        await this.recordMistake(db, userId, answer.questionId, today);
      }
    }
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

  /** Only a review on or after the due day counts, so replaying a quiz right away cannot master it. */
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
